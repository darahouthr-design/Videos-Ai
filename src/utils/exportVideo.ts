import { SubtitleSegment, SubtitleStyle, DubbingConfig } from '../types/subtitle';
import { calculateEffectiveSpeed } from './speedOptimizer';

/**
 * Format seconds to SRT timestamp: HH:MM:SS,mmm
 */
export function formatSRTTime(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const hrs = pad(seconds / 3600);
  const mins = pad((seconds % 3600) / 60);
  const secs = pad(seconds % 60);
  const ms = pad(Math.floor((seconds % 1) * 1000), 3);
  return `${hrs}:${mins}:${secs},${ms}`;
}

/**
 * Format seconds to VTT timestamp: HH:MM:SS.mmm
 */
export function formatVTTTime(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const hrs = pad(seconds / 3600);
  const mins = pad((seconds % 3600) / 60);
  const secs = pad(seconds % 60);
  const ms = pad(Math.floor((seconds % 1) * 1000), 3);
  return `${hrs}:${mins}:${secs}.${ms}`;
}

/**
 * Export subtitles to .SRT format string
 */
export function exportToSRT(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map((sub, index) => {
      return `${index + 1}\n${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n${sub.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Export subtitles to .VTT format string
 */
export function exportToVTT(subtitles: SubtitleSegment[]): string {
  let vtt = 'WEBVTT\n\n';
  subtitles.forEach((sub, index) => {
    vtt += `${index + 1}\n${formatVTTTime(sub.start)} --> ${formatVTTTime(sub.end)}\n${sub.text.trim()}\n\n`;
  });
  return vtt;
}

/**
 * Export plain text script
 */
export function exportToTXT(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map(sub => `[${formatSRTTime(sub.start)} - ${formatSRTTime(sub.end)}] ${sub.text.trim()}`)
    .join('\n');
}

/**
 * Download arbitrary content as a file
 */
export function triggerDownload(content: string | Blob, filename: string, mimeType = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * High quality video burner with canvas rendering + MediaRecorder
 */
export async function renderAndExportBurnedInVideo(
  videoElement: HTMLVideoElement,
  subtitles: SubtitleSegment[],
  style: SubtitleStyle,
  dubbing: DubbingConfig,
  audioClipsMap: Map<string, string>, // segmentId -> audioUrl
  onProgress: (percent: number, currentSec: number, totalSec: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const originalTime = videoElement.currentTime;
      const duration = videoElement.duration || 10;

      // Determine canvas resolution based on video natural resolution
      const width = videoElement.videoWidth || 1280;
      const height = videoElement.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // Audio setup using AudioContext to mix original (or muted) + dubbed audio clips
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // Original video audio track
      let sourceNode: MediaElementAudioSourceNode | null = null;
      try {
        sourceNode = audioCtx.createMediaElementSource(videoElement);
        const originalGain = audioCtx.createGain();
        originalGain.gain.value = dubbing.autoMuteOriginal ? dubbing.originalAudioVolume : 1.0;
        sourceNode.connect(originalGain);
        originalGain.connect(dest);
        originalGain.connect(audioCtx.destination);
      } catch {
        // Element might already be connected or CORS restricted
      }

      // Pre-load dubbed audio buffers if available
      const dubbedBuffers = new Map<string, AudioBuffer>();
      for (const sub of subtitles) {
        const audioUrl = audioClipsMap.get(sub.id) || sub.audioBlobUrl;
        if (audioUrl) {
          try {
            const resp = await fetch(audioUrl);
            const arrayBuf = await resp.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrayBuf);
            dubbedBuffers.set(sub.id, decoded);
          } catch (e) {
            console.warn(`Could not preload audio for sub ${sub.id}`, e);
          }
        }
      }

      // Combined stream: canvas video + mixed audio
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ];
      const mixedStream = new MediaStream(combinedTracks);

      // Determine supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
      });

      const recordedChunks: Blob[] = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const outputBlob = new Blob(recordedChunks, { type: selectedMime });
        videoElement.currentTime = originalTime;
        resolve(outputBlob);
      };

      // Rewind video and start recording
      videoElement.currentTime = 0;
      await new Promise(r => {
        videoElement.onseeked = () => r(null);
      });

      mediaRecorder.start(200);

      // Schedule dubbed audio playback in the audio context
      const dubGain = audioCtx.createGain();
      dubGain.gain.value = dubbing.dubVolume;
      dubGain.connect(dest);

      const startTime = audioCtx.currentTime;
      dubbedBuffers.forEach((buffer, subId) => {
        const sub = subtitles.find(s => s.id === subId);
        if (sub) {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          const subIdx = subtitles.findIndex(s => s.id === subId);
          const nextSub = subIdx >= 0 && subIdx + 1 < subtitles.length ? subtitles[subIdx + 1] : undefined;
          const { effectiveSpeed } = calculateEffectiveSpeed(sub, dubbing.globalSpeed, dubbing.autoSpeedSync, nextSub);
          const safeSpeed = Math.min(2.5, Math.max(0.5, effectiveSpeed));
          source.playbackRate.value = safeSpeed;
          source.connect(dubGain);
          source.start(startTime + sub.start);

          const naturalDuration = buffer.duration / safeSpeed;
          const maxAllowedWindow = nextSub && nextSub.start > sub.start
            ? Math.max(sub.end - sub.start, nextSub.start - sub.start - 0.05)
            : (sub.end - sub.start + 2.0);
          const safeStop = startTime + sub.start + Math.min(naturalDuration, maxAllowedWindow);
          source.stop(safeStop);
        }
      });

      // Play video for real-time capture
      await videoElement.play();

      const scaleFactor = width / 1280; // scale fonts relative to 720p base
      const scaledFontSize = Math.round(style.fontSize * scaleFactor);

      const drawFrame = () => {
        if (videoElement.paused || videoElement.ended || videoElement.currentTime >= duration) {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return;
        }

        // Draw current video frame
        ctx.drawImage(videoElement, 0, 0, width, height);

        const currentTime = videoElement.currentTime;
        onProgress(Math.min(100, Math.round((currentTime / duration) * 100)), currentTime, duration);

        // Find active subtitle
        const activeSub = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

        if (style.showSubtitles !== false && activeSub && activeSub.text.trim()) {
          drawSubtitleOnCanvas(ctx, activeSub.text, width, height, style, scaledFontSize);
        }

        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      videoElement.onended = () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };
    } catch (err) {
      console.error('Export video error:', err);
      reject(err);
    }
  });
}

/**
 * Draw styled subtitle text onto canvas context with word wrap, outline, and background box
 */
export function drawSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  style: SubtitleStyle,
  fontSize: number
) {
  ctx.save();

  const fontStyle = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${fontSize}px '${style.fontFamily}', sans-serif`;
  ctx.font = fontStyle;
  ctx.textAlign = style.alignment;
  ctx.textBaseline = 'bottom';

  // Word wrap
  const maxTextWidth = canvasWidth * 0.85;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxTextWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;

  // Calculate position
  const bottomOffset = (style.positionY / 100) * canvasHeight;
  const startY = canvasHeight - bottomOffset - totalTextHeight + lineHeight;
  let posX = canvasWidth / 2;
  if (style.alignment === 'left') posX = canvasWidth * 0.08;
  if (style.alignment === 'right') posX = canvasWidth * 0.92;

  // Draw background box if opacity > 0
  if (style.backgroundOpacity > 0) {
    const paddingX = fontSize * 0.7;
    const paddingY = fontSize * 0.35;
    lines.forEach((line, i) => {
      const lineWidth = ctx.measureText(line).width;
      let boxX = posX - lineWidth / 2 - paddingX;
      if (style.alignment === 'left') boxX = posX - paddingX;
      if (style.alignment === 'right') boxX = posX - lineWidth - paddingX;

      const lineY = startY + i * lineHeight;
      const boxY = lineY - lineHeight + paddingY * 0.5;

      ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
      roundRect(ctx, boxX, boxY, lineWidth + paddingX * 2, lineHeight, 8);
      ctx.fill();
    });
  }

  // Draw text shadow
  if (style.shadowBlur > 0) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  } else {
    ctx.shadowColor = 'transparent';
  }

  // Draw text lines (stroke + fill)
  lines.forEach((line, i) => {
    const lineY = startY + i * lineHeight;

    if (style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, posX, lineY);
    }

    ctx.fillStyle = style.textColor;
    ctx.fillText(line, posX, lineY);
  });

  ctx.restore();
}

/**
 * Utility to convert hex to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Canvas rounded rect helper
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
