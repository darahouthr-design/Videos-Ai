import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Upload,
  Edit3,
  Check,
  Sparkles,
  Mic,
  SkipBack,
  SkipForward,
  Subtitles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SubtitleSegment, SubtitleStyle, DubbingConfig } from '../types/subtitle';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  subtitles: SubtitleSegment[];
  currentSubtitle: SubtitleSegment | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  style: SubtitleStyle;
  dubbing: DubbingConfig;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (dur: number) => void;
  onPlayPause: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onSeek: (time: number) => void;
  onUpdateSubtitleText: (id: string, newText: string) => void;
  onToggleMuteOriginal: () => void;
  onOriginalVolumeChange: (vol: number) => void;
  onToggleShowSubtitles?: () => void;
  onFileUpload: (file: File) => void;
  appLang: 'km' | 'en';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  videoUrl,
  subtitles,
  currentSubtitle,
  currentTime,
  duration,
  isPlaying,
  style,
  dubbing,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onPlayStateChange,
  onSeek,
  onUpdateSubtitleText,
  onToggleMuteOriginal,
  onOriginalVolumeChange,
  onToggleShowSubtitles,
  onFileUpload,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isEditingOverlay, setIsEditingOverlay] = useState(false);
  const [editText, setEditText] = useState('');

  // Sync edit text when current subtitle changes
  useEffect(() => {
    if (currentSubtitle) {
      setEditText(currentSubtitle.text);
    } else {
      setIsEditingOverlay(false);
    }
  }, [currentSubtitle]);

  // Handle video element timeupdate, loadedmetadata, play, pause, ended
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => onTimeUpdate(video.currentTime);
    const handleLoaded = () => onDurationChange(video.duration || 0);
    const handlePlay = () => onPlayStateChange?.(true);
    const handlePause = () => onPlayStateChange?.(false);
    const handleEnded = () => onPlayStateChange?.(false);

    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, onTimeUpdate, onDurationChange, onPlayStateChange]);

  // Keep video volume in sync with dubbing config (mute original if autoMute is active)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (dubbing.autoMuteOriginal) {
      video.volume = dubbing.originalAudioVolume;
      video.muted = dubbing.originalAudioVolume === 0;
    } else {
      video.volume = 1;
      video.muted = false;
    }
  }, [dubbing.autoMuteOriginal, dubbing.originalAudioVolume, videoRef]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSaveOverlayEdit = () => {
    if (currentSubtitle && editText.trim()) {
      onUpdateSubtitleText(currentSubtitle.id, editText.trim());
    }
    setIsEditingOverlay(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group select-none flex items-center justify-center"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        className="hidden"
        onChange={e => {
          if (e.target.files?.[0]) {
            onFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Main Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        crossOrigin="anonymous"
        className="w-full h-full object-contain cursor-pointer"
        onClick={onPlayPause}
      />

      {/* Upload prompt overlay if no video or quick upload button */}
      {!videoUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950/90 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {isKm ? 'សូមបញ្ចូលវីដេអូរឿងរបស់អ្នក' : 'Upload Your Video Clip'}
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-5">
            {isKm
              ? 'គាំទ្រឯកសារ MP4, WebM, MOV ឬជ្រើសរើសវីដេអូគំរូពីស្ទូឌីយោ'
              : 'Supports MP4, WebM, MOV or select from pre-made movie scenes'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isKm ? 'ជ្រើសរើសវីដេអូពីកុំព្យូទ័រ' : 'Choose Video File'}</span>
          </button>
        </div>
      )}

      {/* Top Overlay Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Original audio status badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {dubbing.autoMuteOriginal ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-700/60 backdrop-blur-md text-[11px] text-amber-300 font-medium">
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKm ? 'សំឡេងដើមបានបិទ (សំឡេង AI ជំនួស)' : 'Original Muted (AI Dubbed)'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-700/60 backdrop-blur-md text-[11px] text-emerald-300 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKm ? 'សំឡេងដើមបើក' : 'Original Audio ON'}</span>
            </div>
          )}

          {currentSubtitle?.audioBase64 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] text-indigo-300">
              <Mic className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>{isKm ? 'សំឡេង AI រួចរាល់' : 'Dubbed Audio Ready'}</span>
            </div>
          )}
        </div>

        {/* Top Right Controls: Subtitle Visibility Toggle Button & Change Video */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onToggleShowSubtitles && (
            <button
              onClick={onToggleShowSubtitles}
              className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm ${
                style.showSubtitles !== false
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700/60 text-neutral-400'
              }`}
              title={
                style.showSubtitles !== false
                  ? (isKm ? 'ចុចទីនេះដើម្បីបិទអក្សររត់' : 'Click to hide running subtitles')
                  : (isKm ? 'ចុចទីនេះដើម្បីបើកអក្សររត់ឡើងវិញ' : 'Click to show running subtitles')
              }
            >
              {style.showSubtitles !== false ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKm ? 'អក្សររត់៖ បើក' : 'Subtitles: ON'}</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300">{isKm ? 'បិទអក្សររត់' : 'Subtitles: OFF'}</span>
                </>
              )}
            </button>
          )}

          {/* Change Video Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 backdrop-blur-md text-xs text-neutral-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isKm ? 'ប្តូរវីដេអូ' : 'Change Video'}</span>
          </button>
        </div>
      </div>

      {/* Styled Live Subtitle Render Overlay (Visible only when showSubtitles !== false) */}
      {style.showSubtitles !== false && currentSubtitle && currentSubtitle.text && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-10 flex justify-center px-6 transition-all duration-150"
          style={{
            bottom: `${style.positionY}%`,
          }}
        >
          {isEditingOverlay ? (
            /* Inline WYSIWYG editing inside overlay */
            <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-xl bg-neutral-950/90 border border-amber-500/50 shadow-2xl max-w-xl w-full animate-in fade-in zoom-in-95">
              <input
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveOverlayEdit();
                  if (e.key === 'Escape') setIsEditingOverlay(false);
                }}
                autoFocus
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white focus:outline-none font-['Kantumruy_Pro',sans-serif]"
                placeholder={isKm ? 'កែសម្រួលអត្ថបទអក្សររត់...' : 'Edit subtitle text...'}
              />
              <button
                onClick={handleSaveOverlayEdit}
                className="p-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 transition"
                title={isKm ? 'រក្សាទុក' : 'Save'}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Styled Live Rendered Subtitle with click-to-edit */
            <div
              onClick={() => {
                setEditText(currentSubtitle.text);
                setIsEditingOverlay(true);
              }}
              title={isKm ? 'ចុចទីនេះដើម្បីកែសម្រួលអត្ថបទផ្ទាល់' : 'Click to directly edit subtitle text'}
              className="pointer-events-auto cursor-pointer group/sub inline-block max-w-[90%] text-center rounded-lg transition-transform hover:scale-[1.01]"
              style={{
                fontFamily: `'${style.fontFamily}', sans-serif`,
                fontSize: `${style.fontSize}px`,
                color: style.textColor,
                fontWeight: style.bold ? 'bold' : 'normal',
                fontStyle: style.italic ? 'italic' : 'normal',
                backgroundColor:
                  style.backgroundOpacity > 0
                    ? `${style.backgroundColor}${Math.round(style.backgroundOpacity * 255)
                        .toString(16)
                        .padStart(2, '0')}`
                    : 'transparent',
                padding: style.backgroundOpacity > 0 ? '6px 14px' : '0px',
                WebkitTextStroke:
                  style.strokeWidth > 0 ? `${style.strokeWidth}px ${style.strokeColor}` : undefined,
                textShadow:
                  style.shadowBlur > 0
                    ? `2px 2px ${style.shadowBlur}px ${style.shadowColor}`
                    : undefined,
                lineHeight: 1.35,
              }}
            >
              <span>{currentSubtitle.text}</span>
              <span className="opacity-0 group-hover/sub:opacity-100 ml-2 inline-flex items-center text-xs bg-amber-500/80 text-neutral-950 px-1.5 py-0.5 rounded shadow transition-opacity">
                <Edit3 className="w-3 h-3 mr-0.5" />
                {isKm ? 'កែ' : 'Edit'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Video Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-neutral-950/95 via-neutral-950/70 to-transparent p-4 transition-opacity duration-300 ${
          isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Scrubber Range Bar */}
        <div className="relative w-full mb-3 flex items-center group/scrub">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={e => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-700/80 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:h-2 transition-all"
          />
        </div>

        {/* Buttons and volume row */}
        <div className="flex items-center justify-between text-neutral-300">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause button */}
            <button
              onClick={onPlayPause}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition shadow-md shadow-amber-500/20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Skip Back 5s */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              title="-5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Skip Forward 5s */}
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              title="+5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Replay */}
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              title={isKm ? 'ចាក់ឡើងវិញ' : 'Restart'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Time display */}
            <span className="text-xs font-mono text-neutral-400 pl-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls: original mute/ducking & fullscreen */}
          <div className="flex items-center gap-3">
            {/* Original Mute Toggle & Volume Slider */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 px-2.5 py-1 rounded-lg border border-neutral-800">
              <button
                onClick={onToggleMuteOriginal}
                className="text-neutral-400 hover:text-amber-400 transition"
                title={
                  dubbing.autoMuteOriginal
                    ? (isKm ? 'បើកសំឡេងដើមឡើងវិញ' : 'Unmute original audio')
                    : (isKm ? 'បិទសំឡេងដើម និងជំនួសដោយសំឡេង AI' : 'Mute original audio for AI voiceover')
                }
              >
                {dubbing.autoMuteOriginal && dubbing.originalAudioVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-neutral-300" />
                )}
              </button>

              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                {isKm ? 'សំឡេងដើម:' : 'Orig:'}
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={dubbing.autoMuteOriginal ? dubbing.originalAudioVolume : 1}
                onChange={e => onOriginalVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                title={isKm ? 'កម្រិតសំឡេងដើម' : 'Original video volume'}
              />
            </div>

            {/* Subtitles CC Toggle button */}
            {onToggleShowSubtitles && (
              <button
                onClick={onToggleShowSubtitles}
                className={`p-1.5 rounded-lg transition ${
                  style.showSubtitles !== false
                    ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-transparent'
                }`}
                title={
                  style.showSubtitles !== false
                    ? (isKm ? 'បិទអក្សររត់ (Hide Subtitles)' : 'Hide Subtitles')
                    : (isKm ? 'បើកអក្សររត់ (Show Subtitles)' : 'Show Subtitles')
                }
              >
                <Subtitles className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
