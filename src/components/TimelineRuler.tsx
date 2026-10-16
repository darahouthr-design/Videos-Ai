import React from 'react';
import { SubtitleSegment } from '../types/subtitle';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

interface TimelineRulerProps {
  subtitles: SubtitleSegment[];
  duration: number;
  currentTime: number;
  activeSegmentId: string | null;
  onSeek: (time: number) => void;
  onSelectSegment: (id: string) => void;
  onNudgeStart: (id: string, delta: number) => void;
  onNudgeEnd: (id: string, delta: number) => void;
  onAddSegmentAtTime: (time: number) => void;
  appLang: 'km' | 'en';
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  subtitles,
  duration,
  currentTime,
  activeSegmentId,
  onSeek,
  onSelectSegment,
  onNudgeStart,
  onNudgeEnd,
  onAddSegmentAtTime,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const totalDuration = Math.max(duration, 1);
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  // Generate tick markers every 2 or 5 seconds
  const step = totalDuration > 60 ? 10 : totalDuration > 30 ? 5 : 2;
  const tickCount = Math.ceil(totalDuration / step);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step).filter(
    t => t <= totalDuration
  );

  const selectedSub = subtitles.find(s => s.id === activeSegmentId);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl">
      {/* Header of Timeline */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-200">
            {isKm ? 'បន្ទាត់ពេលវេលាអក្សររត់ (Subtitle Timeline)' : 'Subtitle Timeline'}
          </span>
          <span className="text-[11px] text-neutral-400">
            ({subtitles.length} {isKm ? 'ឃ្លា' : 'segments'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Subtitle at Current Playhead */}
          <button
            onClick={() => onAddSegmentAtTime(currentTime)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKm ? 'បន្ថែមឃ្លានៅត្រង់នេះ' : 'Add Sub at Time'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Timeline Track */}
      <div
        className="relative w-full h-16 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden cursor-pointer select-none group"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const targetTime = (clickX / rect.width) * totalDuration;
          onSeek(targetTime);
        }}
      >
        {/* Time Ticks */}
        <div className="absolute inset-0 pointer-events-none flex justify-between px-2 text-[10px] text-neutral-500">
          {ticks.map(tick => (
            <div
              key={tick}
              className="absolute top-1 flex flex-col items-center"
              style={{ left: `${(tick / totalDuration) * 100}%` }}
            >
              <div className="w-[1px] h-2 bg-neutral-800" />
              <span className="text-[9px] font-mono mt-0.5">{tick}s</span>
            </div>
          ))}
        </div>

        {/* Subtitle Segment Blocks */}
        <div className="absolute inset-x-0 bottom-2 h-8 px-1">
          {subtitles.map(sub => {
            const leftPercent = Math.max(0, (sub.start / totalDuration) * 100);
            const widthPercent = Math.max(1, ((sub.end - sub.start) / totalDuration) * 100);
            const isActive = sub.id === activeSegmentId;

            return (
              <div
                key={sub.id}
                onClick={e => {
                  e.stopPropagation();
                  onSelectSegment(sub.id);
                  onSeek(sub.start);
                }}
                className={`absolute h-7 rounded-md px-1.5 flex items-center overflow-hidden transition-all text-[11px] font-medium border cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 border-amber-300 font-semibold shadow-lg shadow-amber-500/30 z-10'
                    : 'bg-neutral-800/90 hover:bg-neutral-700/90 text-neutral-200 border-neutral-700/80 hover:border-amber-500/50'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                title={`[${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s] ${sub.text}`}
              >
                <span className="truncate">{sub.text || '(ទទេ)'}</span>
              </div>
            );
          })}
        </div>

        {/* Playhead Scrubber Line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none transition-transform"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1 shadow-md shadow-red-500/50" />
        </div>
      </div>

      {/* Selected Segment Micro-Nudge Controls */}
      {selectedSub && (
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">
              {isKm ? 'ឃ្លាដែលបានជ្រើសរើស:' : 'Selected:'}
            </span>
            <span className="font-semibold text-amber-400 truncate max-w-xs">
              "{selectedSub.text}"
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Start time nudges */}
            <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400 mr-1">
                {isKm ? 'ពេលចាប់ផ្តើម:' : 'Start:'}
              </span>
              <button
                onClick={() => onNudgeStart(selectedSub.id, -0.2)}
                className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="-0.2s"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-amber-300 px-1 font-medium">
                {selectedSub.start.toFixed(2)}s
              </span>
              <button
                onClick={() => onNudgeStart(selectedSub.id, 0.2)}
                className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="+0.2s"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* End time nudges */}
            <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400 mr-1">
                {isKm ? 'ពេលបញ្ចប់:' : 'End:'}
              </span>
              <button
                onClick={() => onNudgeEnd(selectedSub.id, -0.2)}
                className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="-0.2s"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-amber-300 px-1 font-medium">
                {selectedSub.end.toFixed(2)}s
              </span>
              <button
                onClick={() => onNudgeEnd(selectedSub.id, 0.2)}
                className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="+0.2s"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
