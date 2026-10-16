import React from 'react';
import { SubtitleSegment, DubbingConfig } from '../types/subtitle';
import { calculateEffectiveSpeed } from '../utils/speedOptimizer';
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Headphones,
  Gauge,
  Zap,
  Clock,
  Plus,
  Minus,
  Square,
  Users,
  User,
  Bot,
  Loader2,
} from 'lucide-react';
import { resolveSegmentVoice } from '../utils/speedOptimizer';

interface DubbingAudioTabProps {
  subtitles: SubtitleSegment[];
  dubbing: DubbingConfig;
  onChangeDubbing: (newConfig: DubbingConfig) => void;
  onUpdateSubtitle?: (id: string, updates: Partial<SubtitleSegment>) => void;
  onGenerateAllDubbing: () => Promise<void>;
  onGenerateSingleDubbing: (sub: SubtitleSegment) => Promise<void>;
  onPlayDubAudio: (sub: SubtitleSegment) => void;
  onStopAllAudio?: () => void;
  onDetectSpeakerGenders?: () => Promise<void>;
  isDetectingGenders?: boolean;
  playingPreviewSubId?: string | null;
  isGeneratingDubbing: boolean;
  dubbingProgress: number;
  appLang: 'km' | 'en';
}

export const DubbingAudioTab: React.FC<DubbingAudioTabProps> = ({
  subtitles,
  dubbing,
  onChangeDubbing,
  onUpdateSubtitle,
  onGenerateAllDubbing,
  onGenerateSingleDubbing,
  onPlayDubAudio,
  onStopAllAudio,
  onDetectSpeakerGenders,
  isDetectingGenders = false,
  playingPreviewSubId,
  isGeneratingDubbing,
  dubbingProgress,
  appLang,
}) => {
  const isKm = appLang === 'km';

  const voices = [
    {
      id: 'Kore',
      nameKm: '🎙️ អ្នកនិទានរឿងទន់ភ្លន់ពិរោះ (Kore - Warm Storyteller)',
      nameEn: 'Kore (Warm Storyteller)',
      descKm: 'សំឡេងនិយាយបែបធម្មជាតិ ពិរោះរណ្តំ សមស្របការនិទានរឿង និងភាពយន្តមនោសញ្ចេតនា',
      tag: 'ពេញនិយមបំផុត',
    },
    {
      id: 'Fenrir',
      nameKm: '⚡ តួឯកប្រុសភាពយន្ត (Fenrir - Cinematic Hero)',
      nameEn: 'Fenrir (Cinematic Hero)',
      descKm: 'សំឡេងប្រុសធ្ងន់ មុតស្រួច មានអំណាច សមស្របភាពយន្តប្រយុទ្ធ និងសកម្មភាព',
      tag: 'សកម្មភាព',
    },
    {
      id: 'Zephyr',
      nameKm: '🌸 តួឯកស្រីទន់ភ្លន់រំជួលចិត្ត (Zephyr - Gentle Heroine)',
      nameEn: 'Zephyr (Gentle Heroine)',
      descKm: 'សំឡេងស្រីស្រទន់ មានមន្តស្នេហ៍ បង្កប់នូវអារម្មណ៍ជ្រាលជ្រៅ',
      tag: 'មនោសញ្ចេតនា',
    },
    {
      id: 'Puck',
      nameKm: '🎭 តួអង្គរស់រវើក (Puck - Dynamic & Expressive)',
      nameEn: 'Puck (Dynamic Voice)',
      descKm: 'សំឡេងរហ័សរហួន រស់រវើក សមស្របតុក្កតា និងរឿងកំប្លែង',
      tag: 'កំប្លុកកំប្លែង',
    },
    {
      id: 'Charon',
      nameKm: '🏛️ សំឡេងអធិប្បាយបុរាណធ្ងន់ (Charon - Deep Epic)',
      nameEn: 'Charon (Deep Epic)',
      descKm: 'សំឡេងអធិប្បាយធ្ងន់ជ្រៅ អស្ចារ្យ សមស្របរឿងព្រេង និងឯកសារប្រវត្តិសាស្ត្រ',
      tag: 'រឿងព្រេង',
    },
  ];

  const update = (partial: Partial<DubbingConfig>) => {
    onChangeDubbing({ ...dubbing, ...partial });
  };

  const readyAudiosCount = subtitles.filter(s => s.audioBase64 || s.audioBlobUrl).length;

  return (
    <div className="space-y-6">
      {/* 1. Master Audio Ducking & Replacement Card */}
      <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isKm ? 'ការគ្រប់គ្រងសំឡេងដើម & សំឡេង AI ជំនួស' : 'Original Mute & AI Dubbing Replacement'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'បិទសំឡេងដើមនៃវីដេអូដោយស្វ័យប្រវត្តិ ហើយជំនួសដោយសំឡេងអត្ថបទ AI បកប្រែ'
                  : 'Automatically silence original video track and overlay synchronized AI dialogue'}
              </p>
            </div>
          </div>

          {onStopAllAudio && (
            <button
              type="button"
              onClick={onStopAllAudio}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                playingPreviewSubId
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse hover:bg-rose-500/30'
                  : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700/60'
              }`}
              title={isKm ? 'បញ្ឈប់សំឡេងកំពុងចាក់ទាំងអស់ភ្លាមៗ' : 'Stop all playing audio immediately'}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isKm ? 'បញ្ឈប់សំឡេងទាំងអស់' : 'Stop All Audio'}</span>
            </button>
          )}
        </div>

        {/* Master Auto-Mute Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center gap-3">
            {dubbing.autoMuteOriginal ? (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <VolumeX className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-white block">
                {isKm ? 'បិទសំឡេងដើមស្វ័យប្រវត្តិ (Auto-Mute Original)' : 'Auto-Mute Original Video Track'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {dubbing.autoMuteOriginal
                  ? (isKm ? 'សំឡេងដើមត្រូវបានបិទទាំងស្រុង ដើម្បីឮតែសំឡេង AI' : 'Original audio is fully silenced')
                  : (isKm ? 'សំឡេងដើមនៅបន្តឮក្នុងវីដេអូ' : 'Original video audio will play alongside')}
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dubbing.autoMuteOriginal}
              onChange={e => update({ autoMuteOriginal: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Dual Audio Volume Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Original Audio Volume */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                {isKm ? 'កម្រិតសំឡេងដើម (Original Volume)' : 'Original Volume'}
              </span>
              <span className="font-mono text-amber-400">
                {Math.round(dubbing.originalAudioVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={dubbing.originalAudioVolume}
              onChange={e => update({ originalAudioVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              {isKm ? 'ដាក់ 0% ដើម្បីបិទសំឡេងដើមទាំងស្រុង' : 'Set 0% for pure dubbed movie'}
            </span>
          </div>

          {/* AI Dubbed Voice Volume */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                {isKm ? 'កម្រិតសំឡេង AI បញ្ចូល (Dubbed Volume)' : 'AI Voice Volume'}
              </span>
              <span className="font-mono text-amber-400">
                {Math.round(dubbing.dubVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={dubbing.dubVolume}
              onChange={e => update({ dubVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              {isKm ? 'អាចដំឡើងដល់ 150% ឱ្យឮច្បាស់ខ្លាំង' : 'Can boost up to 150%'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Voice Speed Synchronization & Manual Adjustment Card */}
      <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isKm ? 'ការកំណត់ល្បឿនសំឡេងបកប្រែ (Voice Speed Control)' : 'Voice Speed & Duration Sync'}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold border border-amber-500/20">
                  Auto & Manual
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'កែប្រែល្បឿនស្វ័យប្រវត្តឱ្យត្រូវតាមសាច់រឿងក្នុងវីដេអូ ឬកែសម្រួលល្បឿនដោយដៃផ្ទាល់'
                  : 'Auto-sync voice speed to fit scene duration or adjust manually'}
              </p>
            </div>
          </div>
        </div>

        {/* Feature 1: Auto Speed Sync to Scene Duration Toggle */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isKm ? 'កែប្រែល្បឿនស្វ័យប្រវត្តតាមសាច់រឿង (Auto Speed Sync)' : 'Auto-Fit Speed to Scene Duration'}
              </span>
              <span className="text-[11px] text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
                {dubbing.autoSpeedSync
                  ? (isKm ? 'ប្រព័ន្ធគណនាប្រវែងពាក្យពេចន៍ និងសម្រួលល្បឿនស្វ័យប្រវត្តិ មិនឱ្យជាន់លើតួអង្គបន្ទាប់' : 'Automatically stretches/speeds up voice to finish exactly within scene timecode')
                  : (isKm ? 'បានបិទ៖ សំឡេងនឹងនិយាយតាមល្បឿនថេរប៉ុណ្ណោះ' : 'Disabled: All lines speak at constant speed')}
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dubbing.autoSpeedSync}
              onChange={e => update({ autoSpeedSync: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Feature 2: Manual Global Speed Slider & Quick Presets */}
        <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              {isKm ? 'ល្បឿននិយាយរួមដោយដៃ (Manual Global Speed)' : 'Manual Global Speed'}
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {(dubbing.globalSpeed || 1.0).toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.6"
            max="2.0"
            step="0.05"
            value={dubbing.globalSpeed || 1.0}
            onChange={e => update({ globalSpeed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 mr-1">
              {isKm ? 'គំរូល្បឿន:' : 'Presets:'}
            </span>
            {[
              { val: 0.8, label: '0.8x (យឺត)' },
              { val: 1.0, label: '1.0x (ធម្មតា)' },
              { val: 1.15, label: '1.15x' },
              { val: 1.3, label: '1.3x (រហ័ស)' },
              { val: 1.5, label: '1.5x (លឿន)' },
            ].map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => update({ globalSpeed: p.val })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                  Math.abs((dubbing.globalSpeed || 1.0) - p.val) < 0.03
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

  {/* 3. Multi-Speaker Character Gender & Voice Cloning Card */}
      <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isKm ? 'ការបែងចែកសំឡេងតាមតួអង្គប្រុស & ស្រី (Smart Gender Voice Clone)' : 'Multi-Speaker Male & Female Voice Clone'}</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 text-[10px] font-semibold border border-pink-500/20">
                  {isKm ? 'តួប្រុស & តួស្រី' : 'Male & Female'}
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'ប្រសិនបើសំឡេងវីដេអូជាមនុស្សស្រី Clone ជាស្រី បើជាមនុស្សប្រុស Clone ជាប្រុស ហើយបើមានទាំងប្រុសទាំងស្រីក្នុងរឿងតែមួយ ប្រព័ន្ធបែងចែកតាមតួអង្គស្វ័យប្រវត្តិ'
                  : 'Auto-detects female & male dialogue so AI Clone faithfully matches the characters and storyline'}
              </p>
            </div>
          </div>

          {onDetectSpeakerGenders && (
            <button
              type="button"
              onClick={onDetectSpeakerGenders}
              disabled={isDetectingGenders || subtitles.length === 0}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 hover:from-pink-500/30 hover:to-indigo-500/30 border border-pink-500/30 text-pink-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title={isKm ? 'វិភាគស្វែងរកតួអង្គប្រុស និងស្រីក្នុងរឿងដោយស្វ័យប្រវត្តិ' : 'Detect character speakers and genders using AI'}
            >
              {isDetectingGenders ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              )}
              <span>
                {isDetectingGenders
                  ? (isKm ? 'កំពុងវិភាគតួអង្គ...' : 'Analyzing Characters...')
                  : (isKm ? '🪄 វិភាគសំឡេងប្រុស/ស្រីតាមសាច់រឿង' : '🪄 Detect Speaker Genders')}
              </span>
            </button>
          )}
        </div>

        {/* Feature 1: Smart Gender Detection Toggle */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {isKm ? 'ស្វែងរក និងបែងចែកសំឡេងប្រុស/ស្រីស្វ័យប្រវត្តិ' : 'Auto-Match Character Gender'}
              </span>
              <span className="text-[11px] text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
                {dubbing.smartGenderDetection
                  ? (isKm ? 'បើកដំណើរការ៖ ឃ្លាណាជាមនុស្សប្រុសប្រើសំឡេងប្រុស ឃ្លាណាជាមនុស្សស្រីប្រើសំឡេងស្រី' : 'Active: Automatically routes male lines to male AI voice & female lines to female voice')
                  : (isKm ? 'បានបិទ៖ គ្រប់ឃ្លានឹងប្រើសំឡេងតែមួយដូចគ្នា' : 'Disabled: All lines use a single global voice')}
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dubbing.smartGenderDetection}
              onChange={e => update({ smartGenderDetection: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        {/* Default Male and Female Voice Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Default Male Voice */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span>👨</span>
                {isKm ? 'សំឡេងលំនាំដើមតួប្រុស (Male Voice)' : 'Default Male Voice'}
              </span>
              <span className="font-mono text-blue-400 font-bold text-xs">
                {dubbing.defaultMaleVoice || 'Fenrir'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Fenrir', label: 'Fenrir (ហានក្លា)', sub: 'Hero' },
                { id: 'Puck', label: 'Puck (រហ័ស)', sub: 'Dynamic' },
                { id: 'Charon', label: 'Charon (ធ្ងន់)', sub: 'Deep' },
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update({ defaultMaleVoice: v.id as any })}
                  className={`p-2 rounded-lg text-center transition cursor-pointer border ${
                    (dubbing.defaultMaleVoice || 'Fenrir') === v.id
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 border-neutral-800 text-xs'
                  }`}
                >
                  <div className="text-xs">{v.label}</div>
                  <div className="text-[9px] opacity-70">{v.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Default Female Voice */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span className="flex items-center gap-1.5 text-pink-400">
                <span>👩</span>
                {isKm ? 'សំឡេងលំនាំដើមតួស្រី (Female Voice)' : 'Default Female Voice'}
              </span>
              <span className="font-mono text-pink-400 font-bold text-xs">
                {dubbing.defaultFemaleVoice || 'Kore'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'Kore', label: 'Kore (ពិរោះរណ្តំ)', sub: 'Warm Storyteller' },
                { id: 'Zephyr', label: 'Zephyr (ទន់ភ្លន់)', sub: 'Gentle Heroine' },
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update({ defaultFemaleVoice: v.id as any })}
                  className={`p-2 rounded-lg text-center transition cursor-pointer border ${
                    (dubbing.defaultFemaleVoice || 'Kore') === v.id
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 font-bold'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 border-neutral-800 text-xs'
                  }`}
                >
                  <div className="text-xs">{v.label}</div>
                  <div className="text-[9px] opacity-70">{v.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Global Voice Persona Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-neutral-200">
              {isKm ? 'ជម្រើសសំឡេងនិយាយបែបធម្មជាតិ (Global AI Voice Persona)' : 'Global AI Voice Selection'}
            </h4>
          </div>

          <span className="text-xs text-neutral-400">
            {readyAudiosCount}/{subtitles.length} {isKm ? 'ឃ្លាមានសំឡេង' : 'voiced'}
          </span>
        </div>

        <div className="space-y-2.5">
          {voices.map(v => {
            const isSelected = dubbing.voiceName === v.id;
            return (
              <button
                key={v.id}
                onClick={() => update({ voiceName: v.id as any })}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-neutral-900/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">
                      {isKm ? v.nameKm : v.nameEn}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold border border-amber-500/20">
                      {v.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
                    {v.descKm}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-amber-500 bg-amber-500' : 'border-neutral-700'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Batch Voice Generation Action Button */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
        <button
          onClick={onGenerateAllDubbing}
          disabled={isGeneratingDubbing || subtitles.length === 0}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isGeneratingDubbing ? 'animate-spin' : ''}`} />
          <span>
            {isGeneratingDubbing
              ? (isKm ? `កំពុងបង្កើតសំឡេងនិយាយ (${dubbingProgress}%)...` : `Synthesizing Audio (${dubbingProgress}%)...`)
              : (isKm ? 'បង្កើតសំឡេងនិយាយទាំងអស់ (Generate Dubbing for All Lines)' : 'Synthesize Voice for All Lines')}
          </span>
        </button>

        {isGeneratingDubbing && (
          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 transition-all duration-300"
              style={{ width: `${dubbingProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* 4. Subtitle Segment Voice Status List */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-400 px-1">
          {isKm ? 'បញ្ជីសំឡេងតាមឃ្លានីមួយៗ' : 'Segment Voice List'}
        </div>

        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {subtitles.map((sub, i) => {
            const hasAudio = !!(sub.audioBase64 || sub.audioBlobUrl);
            const nextSub = subtitles[i + 1];
            const { effectiveSpeed, isAuto, availableTime } =
              calculateEffectiveSpeed(sub, dubbing.globalSpeed, dubbing.autoSpeedSync, nextSub);
            const resolved = resolveSegmentVoice(sub, dubbing);

            const isSpeedAccelerated = effectiveSpeed > 1.05;
            const isSpeedSlowed = effectiveSpeed < 0.95;

            return (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs space-y-2 hover:border-neutral-700 transition"
              >
                {/* Line 1: Index, timing, dialogue text, play */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-5 h-5 rounded bg-neutral-800 text-amber-400 text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                      ⏱️ {availableTime.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex-1 truncate text-neutral-200 font-['Kantumruy_Pro',sans-serif]">
                    {sub.text}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAudio && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {isKm ? 'រួចរាល់' : 'Ready'}
                      </span>
                    )}

                    <button
                      onClick={() => onPlayDubAudio(sub)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        playingPreviewSubId === sub.id
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400'
                      }`}
                      title={
                        playingPreviewSubId === sub.id
                          ? (isKm ? 'ចុចដើម្បីបញ្ឈប់សំឡេង' : 'Click to stop audio')
                          : (isKm ? 'ស្តាប់សំឡេងឃ្លានេះ' : 'Preview voice')
                      }
                    >
                      {playingPreviewSubId === sub.id ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>

                    <button
                      onClick={() => onGenerateSingleDubbing(sub)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-indigo-400 transition"
                      title={isKm ? 'បង្កើតសំឡេងឡើងវិញ' : 'Regenerate speech'}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Line 2: Character / Gender / Voice Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-neutral-800/60 text-[11px]">
                  {/* Speaker Label & Quick Gender Switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">{isKm ? 'តួអង្គ/ភេទ:' : 'Speaker:'}</span>

                    {/* Quick Gender Toggle: Auto / Male / Female */}
                    <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateSubtitle) {
                            onUpdateSubtitle(sub.id, {
                              speakerGender: 'auto',
                              speaker: isKm ? 'ស្វ័យប្រវត្តិ' : 'Auto',
                            });
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          !sub.speakerGender || sub.speakerGender === 'auto'
                            ? 'bg-neutral-800 text-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={isKm ? 'វិភាគស្វ័យប្រវត្តិ' : 'Auto Detect'}
                      >
                        ⚙️ {isKm ? 'ស្វ័យ' : 'Auto'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateSubtitle) {
                            onUpdateSubtitle(sub.id, {
                              speakerGender: 'male',
                              voiceName: dubbing.defaultMaleVoice || 'Fenrir',
                              speaker: isKm ? 'តួប្រុស' : 'Male',
                            });
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer ${
                          resolved.gender === 'male' && sub.speakerGender === 'male'
                            ? 'bg-blue-500/25 text-blue-300 font-bold border border-blue-500/30'
                            : resolved.gender === 'male'
                            ? 'text-blue-400 font-semibold'
                            : 'text-neutral-500 hover:text-blue-300'
                        }`}
                        title={isKm ? 'កំណត់ជាសំឡេងមនុស្សប្រុស' : 'Set as Male Voice'}
                      >
                        <span>👨</span>
                        <span>{isKm ? 'ប្រុស' : 'Male'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateSubtitle) {
                            onUpdateSubtitle(sub.id, {
                              speakerGender: 'female',
                              voiceName: dubbing.defaultFemaleVoice || 'Kore',
                              speaker: isKm ? 'តួស្រី' : 'Female',
                            });
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer ${
                          resolved.gender === 'female' && sub.speakerGender === 'female'
                            ? 'bg-pink-500/25 text-pink-300 font-bold border border-pink-500/30'
                            : resolved.gender === 'female'
                            ? 'text-pink-400 font-semibold'
                            : 'text-neutral-500 hover:text-pink-300'
                        }`}
                        title={isKm ? 'កំណត់ជាសំឡេងមនុស្សស្រី' : 'Set as Female Voice'}
                      >
                        <span>👩</span>
                        <span>{isKm ? 'ស្រី' : 'Female'}</span>
                      </button>
                    </div>

                    {sub.speaker && (
                      <span className="text-[10px] text-neutral-400 italic truncate max-w-[120px]">
                        ({sub.speaker})
                      </span>
                    )}
                  </div>

                  {/* Segment AI Voice Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500">{isKm ? 'សំឡេង:' : 'Voice:'}</span>
                    <select
                      value={sub.voiceName || 'auto'}
                      onChange={e => {
                        const val = e.target.value as any;
                        if (onUpdateSubtitle) {
                          onUpdateSubtitle(sub.id, {
                            voiceName: val === 'auto' ? undefined : val,
                          });
                        }
                      }}
                      className="bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-md px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="auto">
                        {isKm ? `⚙️ លំនាំដើម (${resolved.voiceName})` : `Default (${resolved.voiceName})`}
                      </option>
                      <optgroup label={isKm ? 'សំឡេងមនុស្សប្រុស' : 'Male Voices'}>
                        <option value="Fenrir">Fenrir (ប្រុសហានក្លា / Hero)</option>
                        <option value="Puck">Puck (ប្រុសរហ័ស / Dynamic)</option>
                        <option value="Charon">Charon (ប្រុសធ្ងន់ / Deep)</option>
                      </optgroup>
                      <optgroup label={isKm ? 'សំឡេងមនុស្សស្រី' : 'Female Voices'}>
                        <option value="Kore">Kore (ស្រីពិរោះរណ្តំ / Storyteller)</option>
                        <option value="Zephyr">Zephyr (ស្រីស្រទន់ / Heroine)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Line 3: Speed Controls (Auto-Sync vs Manual Stepper) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60 text-[11px]">
                  {/* Speed Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">{isKm ? 'ល្បឿនសំឡេង:' : 'Voice Speed:'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateSubtitle) {
                          onUpdateSubtitle(sub.id, {
                            autoSpeedSync: !isAuto,
                            playbackSpeed: isAuto ? effectiveSpeed : undefined,
                          });
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border transition cursor-pointer ${
                        isAuto
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title={
                        isKm
                          ? 'ចុចទីនេះដើម្បីប្តូររវាង ស្វ័យប្រវត្តិ (Auto-Fit) និង កែដៃ (Manual)'
                          : 'Click to toggle between Auto-Fit and Manual Speed'
                      }
                    >
                      {isAuto ? <Zap className="w-3 h-3 text-indigo-400" /> : <Sliders className="w-3 h-3 text-amber-400" />}
                      <span>{effectiveSpeed.toFixed(2)}x</span>
                      <span className="text-[9px] opacity-80">
                        ({isAuto ? (isKm ? 'ស្វ័យប្រវត្តិ' : 'Auto') : (isKm ? 'កែដៃ' : 'Manual')})
                      </span>
                    </button>

                    <span className="text-[10px] text-neutral-500 hidden sm:inline">
                      {isSpeedAccelerated
                        ? (isKm ? '⚡ ពន្លឿនឱ្យចប់ទាន់ឈុត' : '⚡ Accelerated to fit')
                        : isSpeedSlowed
                        ? (isKm ? '⏳ បន្ថយឱ្យល្មមនឹងឈុត' : '⏳ Slowed to fit')
                        : (isKm ? '✓ សមស្របតាមធម្មជាតិ' : '✓ Natural pace')}
                    </span>
                  </div>

                  {/* Manual Stepper Controls if user wants to nudge speed manually */}
                  {onUpdateSubtitle && (
                    <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                      <span className="text-[10px] text-neutral-500 mr-1">{isKm ? 'កែដៃ:' : 'Manual:'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSpeed = Math.max(0.5, parseFloat((effectiveSpeed - 0.05).toFixed(2)));
                          onUpdateSubtitle(sub.id, {
                            playbackSpeed: newSpeed,
                            autoSpeedSync: false,
                          });
                        }}
                        className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                        title="-0.05x"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-neutral-200 px-1 font-semibold text-[10px]">
                        {effectiveSpeed.toFixed(2)}x
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSpeed = Math.min(2.5, parseFloat((effectiveSpeed + 0.05).toFixed(2)));
                          onUpdateSubtitle(sub.id, {
                            playbackSpeed: newSpeed,
                            autoSpeedSync: false,
                          });
                        }}
                        className="p-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                        title="+0.05x"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Reset to Auto button if in manual mode */}
                      {!isAuto && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSubtitle(sub.id, { autoSpeedSync: true });
                          }}
                          className="ml-1 text-[9px] text-indigo-400 hover:text-indigo-300 underline"
                          title={isKm ? 'ត្រឡប់ទៅស្វ័យប្រវត្ត' : 'Reset to Auto'}
                        >
                          {isKm ? 'ស្វ័យប្រវត្តិ' : 'Auto'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
