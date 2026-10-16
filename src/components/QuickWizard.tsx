import React, { useState } from 'react';
import { SubtitleSegment, SubtitleStyle, DubbingConfig, SubtitlePresetId } from '../types/subtitle';
import { STYLE_PRESETS } from '../data/presets';
import {
  Upload,
  Globe2,
  Palette,
  Mic,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  VolumeX,
} from 'lucide-react';

interface QuickWizardProps {
  subtitles: SubtitleSegment[];
  style: SubtitleStyle;
  dubbing: DubbingConfig;
  onChangeStyle: (style: SubtitleStyle) => void;
  onChangeDubbing: (dubbing: DubbingConfig) => void;
  onBatchTranslate: (src: string, tgt: string, tone: string) => Promise<void>;
  onGenerateDubbing: () => Promise<void>;
  onOpenExport: () => void;
  onOpenSamples: () => void;
  isTranslating: boolean;
  isDubbing: boolean;
  appLang: 'km' | 'en';
}

export const QuickWizard: React.FC<QuickWizardProps> = ({
  subtitles,
  style,
  dubbing,
  onChangeStyle,
  onChangeDubbing,
  onBatchTranslate,
  onGenerateDubbing,
  onOpenExport,
  onOpenSamples,
  isTranslating,
  isDubbing,
  appLang,
}) => {
  const isKm = appLang === 'km';
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { num: 1, titleKm: '១. ជ្រើសរើសវីដេអូ', titleEn: '1. Video Clip', icon: Upload },
    { num: 2, titleKm: '២. បកប្រែ AI', titleEn: '2. Translate', icon: Globe2 },
    { num: 3, titleKm: '៣. ម៉ូដអក្សរស្អាត', titleEn: '3. Style Template', icon: Palette },
    { num: 4, titleKm: '៤. សំឡេង & បិទសំឡេងដើម', titleEn: '4. Dub & Mute', icon: Mic },
    { num: 5, titleKm: '៥. នាំចេញវីដេអូ', titleEn: '5. Export', icon: Download },
  ];

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Wizard Stepper Bar */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-neutral-800 gap-2">
        {steps.map(s => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : isDone
                  ? 'bg-neutral-800 text-amber-400'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isKm ? s.titleKm : s.titleEn}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[220px]">
        {/* Step 1: Video */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-white">
              {isKm ? 'ជំហានទី១៖ ជ្រើសរើសវីដេអូរឿងដែលអ្នកចង់បកប្រែ' : 'Step 1: Choose or Upload Movie Scene'}
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
              {isKm
                ? 'អ្នកអាចបញ្ចូលវីដេអូពីកុំព្យូទ័ររបស់អ្នក ឬសាកល្បងឈុតឆាកភាពយន្តគំរូដ៏ស្រស់ស្អាតដែលមានស្រាប់។'
                : 'Upload your own movie clip (MP4, MOV, WebM) or start with a sample movie scene.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={onOpenSamples}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isKm ? 'ជ្រើសរើសវីដេអូគំរូ (Sample Clips)' : 'Open Sample Movies'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Auto-Translate */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-white">
              {isKm ? 'ជំហានទី២៖ បកប្រែអក្សររត់ដោយស្វ័យប្រវត្តិជាមួយ AI' : 'Step 2: Auto-Translate Subtitles with AI'}
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
              {isKm
                ? 'Gemini AI នឹងបកប្រែការសន្ទនាទាំងស្រុងទៅជាភាសាខ្មែរ ដោយរក្សាបាននូវមនោសញ្ចេតនា និងអត្ថន័យភាពយន្តពិតៗ។'
                : 'Gemini AI automatically translates your video dialogue preserving movie storytelling cadence.'}
            </p>
            <button
              onClick={() => onBatchTranslate('English', 'Khmer', 'cinematic')}
              disabled={isTranslating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>
                {isTranslating
                  ? (isKm ? 'កំពុងបកប្រែ...' : 'Translating...')
                  : (isKm ? 'បកប្រែទៅជាភាសាខ្មែរភ្លាមៗ (Translate to Khmer)' : 'Translate to Khmer Now')}
              </span>
            </button>
          </div>
        )}

        {/* Step 3: Style Template */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-white">
              {isKm ? 'ជំហានទី៣៖ ជ្រើសរើសគំរូម៉ូដអក្សររត់ស្អាតៗ' : 'Step 3: Select Beautiful Subtitle Preset'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['netflix', 'tiktok', 'cinema-yellow', 'khmer-moul'] as SubtitlePresetId[]).map(p => (
                <button
                  key={p}
                  onClick={() => onChangeStyle({ ...STYLE_PRESETS[p] })}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    style.preset === p
                      ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-semibold capitalize mb-1">{p}</div>
                  <div className="text-[10px] text-amber-400">
                    {p === 'netflix' ? 'Netflix ស្អាត' : p === 'tiktok' ? 'TikTok ដិត' : p === 'cinema-yellow' ? 'ពណ៌មាស' : 'អក្សរមូល'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: AI Dubbing & Mute */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-white">
              {isKm ? 'ជំហានទី៤៖ បិទសំឡេងដើម & បញ្ចូលសំឡេងនិយាយបែបធម្មជាតិ' : 'Step 4: AI Voiceover & Auto-Mute Original'}
            </h4>

            {/* Mute toggle */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>{isKm ? 'បិទសំឡេងដើមវីដេអូ (Mute Original Audio)' : 'Silence Original Audio'}</span>
              </div>
              <input
                type="checkbox"
                checked={dubbing.autoMuteOriginal}
                onChange={e => onChangeDubbing({ ...dubbing, autoMuteOriginal: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            <button
              onClick={onGenerateDubbing}
              disabled={isDubbing}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>
                {isDubbing
                  ? (isKm ? 'កំពុងផលិតសំឡេង...' : 'Synthesizing voice...')
                  : (isKm ? 'បង្កើតសំឡេងនិយាយទាំងអស់ (Generate Dubbing)' : 'Generate AI Voiceover')}
              </span>
            </button>
          </div>
        )}

        {/* Step 5: Export */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-white">
              {isKm ? 'ជំហានទី៥៖ នាំចេញវីដេអូមានអក្សររត់ស្រាប់គុណភាពខ្ពស់' : 'Step 5: High-Quality Video Export'}
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-['Kantumruy_Pro',sans-serif]">
              {isKm
                ? 'វីដេអូរបស់អ្នករួចរាល់ហើយ! អ្នកអាចនាំចេញជាឯកសារវីដេអូមានអក្សររត់ស្រាប់ ឬទាញយកឯកសារ .SRT / .VTT។'
                : 'Your project is ready! Export video with burned-in subtitles or download subtitle files.'}
            </p>
            <button
              onClick={onOpenExport}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isKm ? 'បើកផ្ទាំងនាំចេញវីដេអូ (Export Video)' : 'Open Export Center'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isKm ? 'ត្រឡប់ក្រោយ' : 'Previous'}</span>
        </button>

        <span className="text-xs font-mono text-neutral-500">
          {currentStep} / {steps.length}
        </span>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          disabled={currentStep === steps.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 text-xs font-bold transition"
        >
          <span>{isKm ? 'បន្ទាប់' : 'Next'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
