import React, { useState } from 'react';
import { SubtitleSegment, SubtitleStyle, DubbingConfig } from '../types/subtitle';
import {
  exportToSRT,
  exportToVTT,
  exportToTXT,
  triggerDownload,
  renderAndExportBurnedInVideo,
} from '../utils/exportVideo';
import {
  Film,
  Download,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  Settings2,
  AlertCircle,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  subtitles: SubtitleSegment[];
  style: SubtitleStyle;
  dubbing: DubbingConfig;
  appLang: 'km' | 'en';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoRef,
  subtitles,
  style,
  dubbing,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSeconds, setExportSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartVideoExport = async () => {
    const video = videoRef.current;
    if (!video) {
      setExportError(isKm ? 'រកមិនឃើញវីដេអូសម្រាប់នាំចេញទេ' : 'No video available to export');
      return;
    }

    try {
      setIsExportingVideo(true);
      setExportError(null);
      setExportedVideoUrl(null);
      setExportProgress(0);

      const audioMap = new Map<string, string>();
      subtitles.forEach(s => {
        if (s.audioBlobUrl) {
          audioMap.set(s.id, s.audioBlobUrl);
        } else if (s.audioBase64) {
          audioMap.set(s.id, `data:audio/wav;base64,${s.audioBase64}`);
        }
      });

      const videoBlob = await renderAndExportBurnedInVideo(
        video,
        subtitles,
        style,
        dubbing,
        audioMap,
        (percent, cur, tot) => {
          setExportProgress(percent);
          setExportSeconds(cur);
          setTotalSeconds(tot);
        }
      );

      const url = URL.createObjectURL(videoBlob);
      setExportedVideoUrl(url);

      // Auto trigger download
      triggerDownload(videoBlob, `cinesub_burned_in_${Date.now()}.webm`, 'video/webm');
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportError(err.message || 'Failed to export video');
    } finally {
      setIsExportingVideo(false);
    }
  };

  const handleExportSRT = () => {
    const srtContent = exportToSRT(subtitles);
    triggerDownload(srtContent, `subtitles_${Date.now()}.srt`, 'text/plain');
  };

  const handleExportVTT = () => {
    const vttContent = exportToVTT(subtitles);
    triggerDownload(vttContent, `subtitles_${Date.now()}.vtt`, 'text/vtt');
  };

  const handleExportTXT = () => {
    const txtContent = exportToTXT(subtitles);
    triggerDownload(txtContent, `dialogue_script_${Date.now()}.txt`, 'text/plain');
  };

  const handleExportJSON = () => {
    const projectData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      subtitles,
      style,
      dubbing,
    };
    triggerDownload(
      JSON.stringify(projectData, null, 2),
      `cinesub_project_${Date.now()}.json`,
      'application/json'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isKm ? 'នាំចេញវីដេអូ & ឯកសារអក្សររត់' : 'Export Video & Subtitle Files'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'នាំចេញជាឯកសារវីដេអូដែលមានអក្សររត់ស្រាប់ (Burned-in) គុណភាពខ្ពស់ និងឯកសារ SRT/VTT'
                  : 'Export burned-in styled video or industry-standard subtitle formats'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Burned-in Subtitle Video Export (Primary Highlight) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-neutral-900/80 to-neutral-950 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                {isKm ? 'នាំចេញវីដេអូមានអក្សររត់ស្រាប់ (Burned-in Subtitles MP4/WebM)' : 'Burn-in Subtitles to Video'}
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
              HD High-Quality
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
            {isKm
              ? 'ប្រព័ន្ធនឹងគូសបញ្ចូលម៉ូដអក្សររត់ និងសំឡេង AI ចូលទៅក្នុងសាច់វីដេអូផ្ទាល់តែម្តង ដោយបិទសំឡេងដើម (ប្រសិនបើបានជ្រើសរើស) ធានាគុណភាពច្បាស់ និងទំហំស្តង់ដារ។'
              : 'Renders the exact fonts, shadows, background boxes and dubbed voice directly into video frames.'}
          </p>

          {/* Export Progress Bar */}
          {isExportingVideo && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>{isKm ? 'កំពុងផលិតវីដេអូ...' : 'Rendering Video Frames & Audio...'}</span>
                <span className="font-mono font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                <div
                  className="bg-amber-500 h-2 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-neutral-400 text-right">
                {exportSeconds.toFixed(1)}s / {totalSeconds.toFixed(1)}s
              </div>
            </div>
          )}

          {/* Export Error Banner */}
          {exportError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Success Download button */}
          {exportedVideoUrl && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'ផលិតវីដេអូជោគជ័យ!' : 'Video successfully rendered!'}</span>
              </div>
              <a
                href={exportedVideoUrl}
                download="cinesub_video.webm"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                {isKm ? 'ទាញយកម្តងទៀត' : 'Download Again'}
              </a>
            </div>
          )}

          {/* Start Export Button */}
          <button
            onClick={handleStartVideoExport}
            disabled={isExportingVideo || subtitles.length === 0}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isExportingVideo ? 'animate-spin' : ''}`} />
            <span>
              {isExportingVideo
                ? (isKm ? 'កំពុងនាំចេញវីដេអូ...' : 'Rendering Burned-in Video...')
                : (isKm ? 'ចាប់ផ្តើមនាំចេញវីដេអូគុណភាពខ្ពស់ (Export HD Video)' : 'Start High-Quality Video Export')}
            </span>
          </button>
        </div>

        {/* Section 2: Subtitle Files Formats */}
        <div>
          <h4 className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider">
            {isKm ? 'ទាញយកឯកសារអក្សររត់ (Subtitle File Formats)' : 'Subtitle Formats'}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* SRT */}
            <button
              onClick={handleExportSRT}
              className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400 mb-1 group-hover:text-amber-300">
                .SRT File
              </div>
              <div className="text-[11px] text-neutral-400">
                {isKm ? 'ស្តង់ដារ SubRip សម្រាប់ VLC & Premiere' : 'SubRip for VLC & Editors'}
              </div>
            </button>

            {/* VTT */}
            <button
              onClick={handleExportVTT}
              className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400 mb-1 group-hover:text-amber-300">
                .VTT File
              </div>
              <div className="text-[11px] text-neutral-400">
                {isKm ? 'WebVTT សម្រាប់វេបសាយ & HTML5' : 'WebVTT for Web Players'}
              </div>
            </button>

            {/* TXT */}
            <button
              onClick={handleExportTXT}
              className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400 mb-1 group-hover:text-amber-300">
                .TXT Script
              </div>
              <div className="text-[11px] text-neutral-400">
                {isKm ? 'អត្ថបទសន្ទនាទទេ ងាយស្រួលអាន' : 'Plain dialogue transcript'}
              </div>
            </button>

            {/* JSON */}
            <button
              onClick={handleExportJSON}
              className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-left transition group cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400 mb-1 group-hover:text-amber-300">
                .JSON Project
              </div>
              <div className="text-[11px] text-neutral-400">
                {isKm ? 'រក្សាទុកគម្រោងពេញលេញ' : 'Backup full project data'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
