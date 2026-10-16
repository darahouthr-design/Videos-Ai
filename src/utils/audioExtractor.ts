/**
 * Utility to extract audio track from video files and downsample to 16kHz mono WAV
 * for fast and accurate Gemini Speech-to-Text transcription.
 */

export async function extractAudioFromVideo(
  videoSource: Blob | File | string,
  maxDurationSeconds = 120
): Promise<{ audioBase64: string; mimeType: string; duration: number }> {
  let arrayBuffer: ArrayBuffer;

  if (typeof videoSource === 'string') {
    const response = await fetch(videoSource);
    arrayBuffer = await response.arrayBuffer();
  } else {
    arrayBuffer = await videoSource.arrayBuffer();
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    // Decodes audio from MP4, WebM, MOV, etc.
    const decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = Math.min(decodedAudio.duration, maxDurationSeconds);

    // Target 16kHz mono for speech recognition
    const targetSampleRate = 16000;
    const targetLength = Math.floor(duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = decodedAudio;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    const audioBase64 = await blobToBase64(wavBlob);

    return {
      audioBase64,
      mimeType: 'audio/wav',
      duration,
    };
  } finally {
    audioCtx.close().catch(() => {});
  }
}

/**
 * Convert AudioBuffer into a WAV Blob (16-bit PCM mono)
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write WAV RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write 16-bit PCM audio samples with clipping prevention
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    let sample = channelData[i];
    sample = Math.max(-1, Math.min(1, sample)); // clamp
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
