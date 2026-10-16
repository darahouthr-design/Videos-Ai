import React, { useState } from 'react';
import { SubtitleSegment } from '../types/subtitle';
import { SUPPORTED_LANGUAGES } from '../data/presets';
import {
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Film,
  Mic,
  FileCheck,
} from 'lucide-react';

interface TranslationTabProps {
  subtitles: SubtitleSegment[];
  onBatchTranslate: (sourceLang: string, targetLang: string, tone: string) => Promise<void>;
  onAutoCorrect: (language: string) => Promise<void>;
  onAutoTranscribeScene: () => Promise<void>;
  onOpenPipeline?: () => void;
  isTranslating: boolean;
  isAutoCorrecting: boolean;
  isTranscribing: boolean;
  autoCorrectSummary: string | null;
  appLang: 'km' | 'en';
}

export const TranslationTab: React.FC<TranslationTabProps> = ({
  subtitles,
  onBatchTranslate,
  onAutoCorrect,
  onAutoTranscribeScene,
  onOpenPipeline,
  isTranslating,
  isAutoCorrecting,
  isTranscribing,
  autoCorrectSummary,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Khmer');
  const [tone, setTone] = useState('cinematic');

  const tones = [
    {
      id: 'cinematic',
      nameKm: 'ភាពយន្តរំជួលចិត្ត (Cinematic Drama)',
      nameEn: 'Cinematic Drama',
      descKm: 'ប្រើពាក្យពេចន៍ទាក់ទាញ បង្កប់មនោសញ្ចេតនាយ៉ាងរណ្តំដូចក្នុងរោងកុន',
    },
    {
      id: 'action',
      nameKm: 'សកម្មភាព & ក្លាហាន (Action & Thriller)',
      nameEn: 'Action & Thriller',
      descKm: 'ឃ្លាខ្លីៗ មុតស្រួច មានថាមពល សមស្របឈុតឆាកប្រយុទ្ធ',
    },
    {
      id: 'legend',
      nameKm: 'រឿងព្រេងនិទានបុរាណ (Fantasy / Legend)',
      nameEn: 'Fantasy / Legend',
      descKm: 'ប្រើរាជសព្ទ ឬពាក្យពេចន៍បុរាណដ៏ឧត្តុង្គឧត្តម',
    },
    {
      id: 'casual',
      nameKm: 'សន្ទនាបែបធម្មតា (Casual Conversation)',
      nameEn: 'Casual Conversation',
      descKm: 'ភាសាសាមញ្ញ ងាយយល់ សមស្របភាពយន្តជីវិតរស់នៅប្រចាំថ្ងៃ',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Auto-Transcribe dialogue from video/scene */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {isKm ? 'ទាញយកអក្សររត់ពីវីដេអូដោយស្វ័យប្រវត្តិ (AI Auto-Transcribe)' : 'Auto-Generate Subtitles from Video'}
              </h4>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'ប្រើប្រាស់ Gemini AI ដើម្បីចាប់យកការសន្ទនា និងកំណត់ពេលវេលាស្វ័យប្រវត្តិ'
                  : 'AI analyzes speech or scene visuals to generate timestamped subtitles'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPipeline && (
              <button
                onClick={onOpenPipeline}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{isKm ? 'ដំណើរការស្វ័យប្រវត្ត 3-in-1' : '3-in-1 Pipeline'}</span>
              </button>
            )}

            <button
              onClick={onAutoTranscribeScene}
              disabled={isTranscribing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-xs transition"
            >
              <Mic className={`w-3.5 h-3.5 text-amber-400 ${isTranscribing ? 'animate-spin' : ''}`} />
              <span>
                {isTranscribing
                  ? (isKm ? 'កំពុងបង្កើតអក្សរ...' : 'Transcribing...')
                  : (isKm ? 'ទាញយកតែអក្សររត់' : 'Transcribe Only')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Translation Settings Section */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <Globe2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-neutral-200">
            {isKm ? 'ការកំណត់ការបកប្រែពហុភាសា' : 'Multi-Language Translation Engine'}
          </h3>
        </div>

        {/* Language Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
          {/* Source Language */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              {isKm ? 'ភាសាដើម (Source Language)' : 'Source Language'}
            </label>
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Auto-Detect">✨ {isKm ? 'ស្វែងរកភាសាដើមស្វ័យប្រវត្តិ' : 'Auto-Detect'}</option>
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {isKm ? lang.nameKm : lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-amber-400">
            <ArrowRight className="w-5 h-5 hidden sm:block" />
          </div>

          {/* Target Language */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              {isKm ? 'បកប្រែទៅជាភាសា (Target Language)' : 'Target Language'}
            </label>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold text-amber-400"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {isKm ? lang.nameKm : lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Tone Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            {isKm ? 'រចនាបថ និងបរិយាកាសនៃការបកប្រែ (Translation Tone)' : 'Cinematic Tone'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tones.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  tone === t.id
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="text-xs font-bold text-amber-400 mb-0.5">
                  {isKm ? t.nameKm : t.nameEn}
                </div>
                <div className="text-[11px] text-neutral-400 leading-normal">
                  {t.descKm}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Translate Action Button */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onBatchTranslate(sourceLang, targetLang, tone)}
            disabled={isTranslating || subtitles.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
            <span>
              {isTranslating
                ? (isKm ? 'កំពុងបកប្រែដោយ AI...' : 'Translating with Gemini AI...')
                : (isKm ? `បកប្រែអក្សររត់ទាំងអស់ទៅជា ${targetLang}` : `Translate All to ${targetLang}`)}
            </span>
          </button>

          {/* Auto Correct / Grammar Proofreader */}
          <button
            onClick={() => onAutoCorrect(targetLang)}
            disabled={isAutoCorrecting || subtitles.length === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
            title={isKm ? 'កែតម្រូវអក្ខរាវិរុទ្ធខ្មែរ គម្លាតពាក្យ និងវេយ្យាករណ៍' : 'Auto-proofread spelling and spacing'}
          >
            <FileCheck className={`w-4 h-4 ${isAutoCorrecting ? 'animate-spin' : 'text-indigo-400'}`} />
            <span>
              {isAutoCorrecting
                ? (isKm ? 'កំពុងកែតម្រូវ...' : 'Proofreading...')
                : (isKm ? 'កែតម្រូវអក្ខរាវិរុទ្ធស្វ័យប្រវត្តិ' : 'AI Grammar Proofread')}
            </span>
          </button>
        </div>
      </div>

      {/* Auto-Correction Report Card if available */}
      {autoCorrectSummary && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-emerald-300 mb-1">
              {isKm ? 'លទ្ធផលនៃការកែតម្រូវស្វ័យប្រវត្តិ' : 'AI Auto-Correction Report'}
            </h5>
            <p className="text-xs text-neutral-300 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
              {autoCorrectSummary}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Preview of Dialogues */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold px-1">
          <span>{isKm ? 'ឈុតឆាកសន្ទនាបច្ចុប្បន្ន' : 'Current Dialogue Subtitles'}</span>
          <span>{subtitles.length} {isKm ? 'ឃ្លា' : 'lines'}</span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {subtitles.map((sub, i) => (
            <div
              key={sub.id}
              className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-mono text-neutral-500 text-[10px]">
                  {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                </span>
              </div>
              <div className="flex-1 text-neutral-200 font-medium font-['Kantumruy_Pro',sans-serif]">
                {sub.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
