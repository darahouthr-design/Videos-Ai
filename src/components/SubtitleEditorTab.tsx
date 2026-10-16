import React, { useState } from 'react';
import { SubtitleSegment } from '../types/subtitle';
import {
  Play,
  Trash2,
  Scissors,
  Layers,
  Sparkles,
  Plus,
  Search,
  Replace,
  Volume2,
  CheckCircle2,
  Clock,
  Square,
  Users,
  Loader2,
  Eye,
  EyeOff,
  Subtitles,
} from 'lucide-react';

interface SubtitleEditorTabProps {
  subtitles: SubtitleSegment[];
  activeSegmentId: string | null;
  onUpdateSubtitle: (id: string, updates: Partial<SubtitleSegment>) => void;
  onDeleteSubtitle: (id: string) => void;
  onAddSubtitle: (afterId?: string) => void;
  onSplitSubtitle: (id: string) => void;
  onMergeWithNext: (id: string) => void;
  onPlaySegment: (start: number, end: number) => void;
  onSpeakSegment: (sub: SubtitleSegment) => void;
  onStopAllAudio?: () => void;
  playingPreviewSubId?: string | null;
  onAutoCorrectAll: () => void;
  isAutoCorrecting: boolean;
  onDetectSpeakerGenders?: () => Promise<void>;
  isDetectingGenders?: boolean;
  showSubtitles?: boolean;
  onToggleShowSubtitles?: () => void;
  appLang: 'km' | 'en';
}

export const SubtitleEditorTab: React.FC<SubtitleEditorTabProps> = ({
  subtitles,
  activeSegmentId,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  onSplitSubtitle,
  onMergeWithNext,
  onPlaySegment,
  onSpeakSegment,
  onStopAllAudio,
  playingPreviewSubId,
  onAutoCorrectAll,
  isAutoCorrecting,
  onDetectSpeakerGenders,
  isDetectingGenders = false,
  showSubtitles = true,
  onToggleShowSubtitles,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showSearchReplace, setShowSearchReplace] = useState(false);

  const [replaceStatus, setReplaceStatus] = useState<string | null>(null);

  // Perform search & replace across all subtitles
  const handleExecuteReplace = () => {
    if (!searchQuery.trim()) return;
    let count = 0;
    subtitles.forEach(sub => {
      if (sub.text.includes(searchQuery)) {
        const updated = sub.text.replaceAll(searchQuery, replaceQuery);
        onUpdateSubtitle(sub.id, { text: updated });
        count++;
      }
    });
    setReplaceStatus(
      isKm
        ? `បានជំនួសពាក្យជោគជ័យចំនួន ${count} កន្លែង!`
        : `Successfully replaced ${count} occurrences!`
    );
    setTimeout(() => setReplaceStatus(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Subtitle Button */}
          <button
            onClick={() => onAddSubtitle()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isKm ? 'បន្ថែមឃ្លាថ្មី' : 'Add Subtitle'}</span>
          </button>

          {/* AI Auto-Correct & Polish Button */}
          <button
            onClick={onAutoCorrectAll}
            disabled={isAutoCorrecting || subtitles.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            title={isKm ? 'ពិនិត្យអក្ខរាវិរុទ្ធ និងកែសម្រួលពាក្យពេចន៍ដោយស្វ័យប្រវត្តិ' : 'Auto-correct spelling & polish with AI'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAutoCorrecting ? 'animate-spin' : 'text-indigo-400'}`} />
            <span>
              {isAutoCorrecting
                ? (isKm ? 'កំពុងកែតម្រូវ...' : 'Correcting...')
                : (isKm ? 'កែតម្រូវស្វ័យប្រវត្តិ' : 'AI Auto-Fix')}
            </span>
          </button>

          {/* AI Detect Character Speaker Genders Button */}
          {onDetectSpeakerGenders && (
            <button
              onClick={onDetectSpeakerGenders}
              disabled={isDetectingGenders || subtitles.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              title={isKm ? 'វិភាគស្វែងរកតួអង្គប្រុស/ស្រីតាមសាច់រឿង' : 'Auto-detect character speaker genders'}
            >
              {isDetectingGenders ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-pink-400" />
              )}
              <span>
                {isDetectingGenders
                  ? (isKm ? 'កំពុងវិភាគ...' : 'Detecting...')
                  : (isKm ? 'វិភាគតួប្រុស/ស្រី' : 'Detect Genders')}
              </span>
            </button>
          )}
        </div>

        {/* Right side buttons: Subtitles toggle and Search & Replace */}
        <div className="flex items-center gap-2">
          {onToggleShowSubtitles && (
            <button
              onClick={onToggleShowSubtitles}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showSubtitles !== false
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title={
                showSubtitles !== false
                  ? (isKm ? 'ចុចដើម្បីបិទអក្សររត់លើវីដេអូ' : 'Click to hide running subtitles')
                  : (isKm ? 'ចុចដើម្បីបើកអក្សររត់លើវីដេអូ' : 'Click to show running subtitles')
              }
            >
              {showSubtitles !== false ? (
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

          {/* Toggle Search & Replace */}
          <button
            onClick={() => setShowSearchReplace(!showSearchReplace)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              showSearchReplace
                ? 'bg-neutral-800 text-amber-400 border-amber-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isKm ? 'ស្វែងរក & ជំនួសពាក្យ' : 'Find & Replace'}</span>
          </button>
        </div>
      </div>

      {/* Search & Replace Panel */}
      {showSearchReplace && (
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 min-w-[150px] relative">
            <input
              type="text"
              placeholder={isKm ? 'ពាក្យដែលត្រូវស្វែងរក...' : 'Find text...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex-1 min-w-[150px] relative">
            <input
              type="text"
              placeholder={isKm ? 'ជំនួសដោយពាក្យ...' : 'Replace with...'}
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={handleExecuteReplace}
            disabled={!searchQuery.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-semibold transition"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>{isKm ? 'ជំនួសទាំងអស់' : 'Replace All'}</span>
          </button>
          {replaceStatus && (
            <div className="w-full text-xs text-emerald-400 font-medium flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{replaceStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Subtitles Segment List */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {subtitles.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
            <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 mb-1">
              {isKm ? 'មិនទាន់មានអក្សររត់នៅឡើយទេ' : 'No subtitle segments yet'}
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              {isKm
                ? 'ចុចប៊ូតុង "បន្ថែមឃ្លាថ្មី" ឬប្រើផ្ទាំងបកប្រែ AI ដើម្បីបង្កើតស្វ័យប្រវត្តិ'
                : 'Click "Add Subtitle" or use AI translation tab to generate automatically'}
            </p>
            <button
              onClick={() => onAddSubtitle()}
              className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-semibold text-xs"
            >
              {isKm ? '+ បន្ថែមឃ្លាទី១' : '+ Add First Subtitle'}
            </button>
          </div>
        ) : (
          subtitles.map((sub, index) => {
            const isActive = sub.id === activeSegmentId;
            const durationSec = (sub.end - sub.start).toFixed(2);

            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-neutral-900/90 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Segment Header: Index & Timestamps & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-neutral-800 text-amber-400 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Start Time Input */}
                    <div className="flex items-center gap-1 text-xs bg-neutral-950 px-2 py-1 rounded-md border border-neutral-800">
                      <span className="text-[10px] text-neutral-500">START</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={sub.start}
                        onChange={e =>
                          onUpdateSubtitle(sub.id, { start: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                        className="w-14 bg-transparent font-mono text-neutral-200 text-xs focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-500">s</span>
                    </div>

                    <span className="text-neutral-600 text-xs">→</span>

                    {/* End Time Input */}
                    <div className="flex items-center gap-1 text-xs bg-neutral-950 px-2 py-1 rounded-md border border-neutral-800">
                      <span className="text-[10px] text-neutral-500">END</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={sub.end}
                        onChange={e =>
                          onUpdateSubtitle(sub.id, { end: Math.max(sub.start + 0.1, parseFloat(e.target.value) || 0) })
                        }
                        className="w-14 bg-transparent font-mono text-neutral-200 text-xs focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-500">s</span>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800/50">
                      {durationSec}s
                    </span>

                    {/* Speaker Gender Switcher: Male / Female / Auto */}
                    <div className="flex items-center bg-neutral-950 px-1.5 py-0.5 rounded-md border border-neutral-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const nextGender = sub.speakerGender === 'male' ? 'female' : sub.speakerGender === 'female' ? 'auto' : 'male';
                          const nextSpeaker = nextGender === 'male' ? (isKm ? 'តួប្រុស' : 'Male') : nextGender === 'female' ? (isKm ? 'តួស្រី' : 'Female') : undefined;
                          onUpdateSubtitle(sub.id, {
                            speakerGender: nextGender,
                            speaker: nextSpeaker,
                          });
                        }}
                        className={`px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                          sub.speakerGender === 'female'
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : sub.speakerGender === 'male'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={isKm ? 'ចុចដើម្បីប្តូរភេទតួអង្គ (ប្រុស / ស្រី / ស្វ័យ)' : 'Click to toggle gender (Male / Female / Auto)'}
                      >
                        <span>{sub.speakerGender === 'female' ? '👩 ស្រី' : sub.speakerGender === 'male' ? '👨 ប្រុស' : '⚙️ ស្វ័យ'}</span>
                        {sub.speaker && (
                          <span className="text-[9px] opacity-75 font-normal max-w-[80px] truncate hidden md:inline">
                            {sub.speaker}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Speed indicator & quick adjuster */}
                    <div className="hidden sm:flex items-center gap-1 bg-neutral-950 px-1.5 py-0.5 rounded-md border border-neutral-800 text-[10px]">
                      <span className="text-neutral-500">{isKm ? 'ល្បឿន:' : 'Speed:'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = sub.playbackSpeed || 1.0;
                          const next = Math.max(0.6, parseFloat((cur - 0.1).toFixed(1)));
                          onUpdateSubtitle(sub.id, { playbackSpeed: next, autoSpeedSync: false });
                        }}
                        className="p-0.5 text-neutral-400 hover:text-white"
                        title="-0.1x"
                      >
                        -
                      </button>
                      <span className="font-mono text-amber-300 font-semibold">
                        {(sub.playbackSpeed || (sub.autoSpeedSync === false ? 1.0 : 1.1)).toFixed(1)}x
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = sub.playbackSpeed || 1.0;
                          const next = Math.min(2.0, parseFloat((cur + 0.1).toFixed(1)));
                          onUpdateSubtitle(sub.id, { playbackSpeed: next, autoSpeedSync: false });
                        }}
                        className="p-0.5 text-neutral-400 hover:text-white"
                        title="+0.1x"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Segment Actions */}
                  <div className="flex items-center gap-1">
                    {/* Play this segment */}
                    <button
                      onClick={() => onPlaySegment(sub.start, sub.end)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition"
                      title={isKm ? 'ចាក់ស្តាប់ឈុតនេះ' : 'Play segment in video'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Speak TTS */}
                    <button
                      onClick={() => onSpeakSegment(sub)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        playingPreviewSubId === sub.id
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-indigo-400'
                      }`}
                      title={
                        playingPreviewSubId === sub.id
                          ? (isKm ? 'បញ្ឈប់សំឡេងអាន' : 'Stop voiceover')
                          : (isKm ? 'ចាក់ស្តាប់សំឡេងអាន' : 'Listen to voiceover')
                      }
                    >
                      {playingPreviewSubId === sub.id ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Split */}
                    <button
                      onClick={() => onSplitSubtitle(sub.id)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 transition"
                      title={isKm ? 'កាត់ឃ្លានេះជាពីរ' : 'Split segment'}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    {/* Merge with next */}
                    {index < subtitles.length - 1 && (
                      <button
                        onClick={() => onMergeWithNext(sub.id)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 transition"
                        title={isKm ? 'បញ្ចូលជាមួយឃ្លាបន្ទាប់' : 'Merge with next'}
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteSubtitle(sub.id)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition"
                      title={isKm ? 'លុបឃ្លានេះ' : 'Delete segment'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle Text Input Area */}
                <div className="relative">
                  <textarea
                    rows={2}
                    value={sub.text}
                    onChange={e => onUpdateSubtitle(sub.id, { text: e.target.value })}
                    placeholder={isKm ? 'វាយបញ្ចូលអត្ថបទអក្សររត់នៅទីនេះ...' : 'Enter subtitle dialogue text...'}
                    className="w-full bg-neutral-950 border border-neutral-800/90 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 resize-none font-['Kantumruy_Pro',sans-serif] leading-relaxed"
                  />

                  {/* Correction note if available */}
                  {sub.correctedNote && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/90">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{sub.correctedNote}</span>
                    </div>
                  )}

                  {sub.originalText && sub.originalText !== sub.text && (
                    <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-1">
                      <span className="text-neutral-600">ដើម:</span>
                      <span className="italic truncate">{sub.originalText}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
