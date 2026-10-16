import React, { useState } from 'react';
import { SubtitleSegment, DubbingConfig } from '../types/subtitle';
import { SUPPORTED_LANGUAGES } from '../data/presets';
import { extractAudioFromVideo } from '../utils/audioExtractor';
import { detectGenderFromText } from '../utils/speedOptimizer';
import { fetchAudioPipeline, fetchDubbingTTS } from '../services/aiApi';
import {
  Sparkles,
  Volume2,
  FileText,
  Globe2,
  Mic,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface AudioToVoicePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoDuration: number;
  uploadedFile: File | null;
  onPipelineComplete: (
    newSubtitles: SubtitleSegment[],
    dubbingConfig: Partial<DubbingConfig>,
    summaryMessage: string
  ) => void;
  appLang: 'km' | 'en';
}

export const AudioToVoicePipelineModal: React.FC<AudioToVoicePipelineModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoDuration,
  uploadedFile,
  onPipelineComplete,
  appLang,
}) => {
  const isKm = appLang === 'km';

  // Config settings
  const [targetLanguage, setTargetLanguage] = useState('Khmer');
  const [tone, setTone] = useState('cinematic');
  const [voiceName, setVoiceName] = useState<'Kore' | 'Fenrir' | 'Zephyr' | 'Puck' | 'Charon'>('Kore');
  const [smartGenderClone, setSmartGenderClone] = useState(true);
  const [autoMuteOriginal, setAutoMuteOriginal] = useState(true);

  // Execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartPipeline = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setOverallProgress(5);

      // --- STAGE 1: Extract Audio from Video ---
      setCurrentStage(1);
      setStageMessage(
        isKm
          ? 'ដំណាក់កាលទី១៖ កំពុងទាញយកសំឡេងចេញពីវីដេអូ...'
          : 'Stage 1: Extracting audio track from video file...'
      );

      let audioBase64: string | undefined = undefined;
      let mimeType = 'audio/wav';

      try {
        const sourceToExtract = uploadedFile || videoUrl;
        const extracted = await extractAudioFromVideo(sourceToExtract, Math.min(videoDuration, 120));
        audioBase64 = extracted.audioBase64;
        mimeType = extracted.mimeType;
      } catch (extractErr) {
        console.warn('Audio extraction warning (using scene fallback if needed):', extractErr);
      }

      setOverallProgress(30);

      // --- STAGE 2 & 3: Transcribe Audio to Text & Translate to Target Language ---
      setCurrentStage(2);
      setStageMessage(
        isKm
          ? 'ដំណាក់កាលទី២ & ៣៖ កំពុងបំលែងសំឡេងជាអក្សរ និងបកប្រែដោយ Gemini AI...'
          : 'Stage 2 & 3: Transcribing audio to text & translating with Gemini AI...'
      );

      const segments = await fetchAudioPipeline(
        audioBase64,
        mimeType,
        targetLanguage,
        tone,
        Math.round(videoDuration),
        'Movie story dialogue scene'
      );

      if (!segments || segments.length === 0) {
        throw new Error(isKm ? 'មិនអាចទាញយកអក្សរពីសំឡេងបានទេ' : 'Could not transcribe speech from audio');
      }

      setOverallProgress(65);

      // --- STAGE 4: Synthesize Dubbed Voice for Translated Segments ---
      setCurrentStage(3);
      setStageMessage(
        isKm
          ? `ដំណាក់កាលទី៤៖ កំពុងបង្កើតសំឡេងនិយាយតាមតួអង្គ (ប្រុស/ស្រី)...`
          : `Stage 4: Synthesizing character voices (Male & Female)...`
      );

      const updatedSegments: SubtitleSegment[] = [...segments];

      // Synthesize audio clips for segments
      for (let i = 0; i < updatedSegments.length; i++) {
        const seg = updatedSegments[i];
        if (seg.text.trim()) {
          try {
            let segGender: 'male' | 'female' = 'male';
            let segVoice = voiceName;

            if (smartGenderClone) {
              if (seg.speakerGender === 'female' || seg.speakerGender === 'male') {
                segGender = seg.speakerGender;
              } else {
                segGender = detectGenderFromText(seg.text, seg.originalText);
              }

              if (seg.voiceName && seg.voiceName !== 'auto') {
                segVoice = seg.voiceName as any;
              } else if (segGender === 'female') {
                segVoice = 'Kore';
              } else {
                segVoice = 'Fenrir';
              }
            } else {
              segGender = voiceName === 'Kore' || voiceName === 'Zephyr' ? 'female' : 'male';
            }

            seg.speakerGender = segGender;
            seg.voiceName = segVoice;

            const ttsResult = await fetchDubbingTTS(
              seg.text,
              segVoice,
              'Natural cinematic movie narration',
              segGender
            );

            if (ttsResult && ttsResult.audioBase64) {
              const blob = new Blob([Uint8Array.from(atob(ttsResult.audioBase64), c => c.charCodeAt(0))], {
                type: 'audio/wav',
              });
              seg.audioBase64 = ttsResult.audioBase64;
              seg.audioBlobUrl = URL.createObjectURL(blob);
              seg.voiceName = segVoice;
            }
          } catch (e) {
            console.warn(`TTS generation notice for line ${i + 1}:`, e);
          }
        }
        setOverallProgress(65 + Math.round(((i + 1) / updatedSegments.length) * 30));
      }

      // --- STAGE 5: Complete & Auto-Mute Original ---
      setCurrentStage(4);
      setOverallProgress(100);
      setStageMessage(
        isKm
          ? 'ដំណើរការជោគជ័យ! សំឡេងដើមត្រូវបានបិទ និងជំនួសដោយសំឡេងបកប្រែថ្មី។'
          : 'Pipeline complete! Original audio silenced and replaced with new voice.'
      );

      setTimeout(() => {
        setIsProcessing(false);
        onPipelineComplete(
          updatedSegments,
          {
            autoMuteOriginal,
            originalAudioVolume: autoMuteOriginal ? 0 : 0.3,
            voiceName,
          },
          isKm
            ? `បានទាញយកសំឡេង បកប្រែជាភាសា ${targetLanguage} និងបង្កើតសំឡេងថ្មីចំនួន ${updatedSegments.length} ឃ្លា!`
            : `Extracted audio, translated to ${targetLanguage}, and synthesized ${updatedSegments.length} dubbed voice lines!`
        );
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Audio pipeline failed:', err);
      setErrorMsg(err.message || 'Failed to complete pipeline');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isKm ? 'ដំណើរការស្វ័យប្រវត្តិ 3-in-1' : '3-in-1 Auto Video Pipeline'}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold border border-amber-500/20">
                  Audio ➔ Text ➔ Voice
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-['Kantumruy_Pro',sans-serif]">
                {isKm
                  ? 'ទាញយកសំឡេងក្នុងវីដេអូជាអក្សរ ➔ បកប្រែភាសា ➔ បង្កើតជាសំឡេងនិយាយថ្មីដោយស្វ័យប្រវត្តិ'
                  : 'Extract video audio to text ➔ Translate ➔ Convert back to natural voiceover'}
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Visual Pipeline Flow Diagram */}
        <div className="grid grid-cols-3 gap-2 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-neutral-950/50">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">១. ទាញសំឡេង</span>
            <span className="text-[10px] text-neutral-400">Speech-to-Text</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-neutral-950/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1.5">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">២. បកប្រែ AI</span>
            <span className="text-[10px] text-neutral-400">Translate to Khmer</span>
          </div>

          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-neutral-950/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">៣. បង្កើតសំឡេង</span>
            <span className="text-[10px] text-neutral-400">AI Dubbing & Mute</span>
          </div>
        </div>

        {/* Processing Progress Screen */}
        {isProcessing ? (
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-amber-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-['Kantumruy_Pro',sans-serif]">{stageMessage}</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{overallProgress}%</span>
            </div>

            <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 h-2.5 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-neutral-400 pt-1 font-['Kantumruy_Pro',sans-serif]">
              <span className={currentStage >= 1 ? 'text-amber-400 font-semibold' : ''}>
                ✓ ទាញយកសំឡេង
              </span>
              <span className={currentStage >= 2 ? 'text-amber-400 font-semibold' : ''}>
                ✓ បំលែង & បកប្រែ
              </span>
              <span className={currentStage >= 3 ? 'text-amber-400 font-semibold' : ''}>
                ✓ សំឡេង AI
              </span>
              <span className={currentStage >= 4 ? 'text-emerald-400 font-semibold' : ''}>
                ✓ បិទសំឡេងដើម
              </span>
            </div>
          </div>
        ) : (
          /* Configuration Settings */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Language */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {isKm ? 'ភាសាដែលត្រូវបកប្រែ (Target Language)' : 'Target Language'}
                </label>
                <select
                  value={targetLanguage}
                  onChange={e => setTargetLanguage(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold text-amber-400"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.name}>
                      {lang.flag} {isKm ? lang.nameKm : lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Natural Voice Persona */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {isKm ? 'សំឡេងនិយាយថ្មី (Voice Persona)' : 'Voiceover Persona'}
                </label>
                <select
                  value={voiceName}
                  onChange={e => setVoiceName(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Kore">🎙️ Kore - អ្នកនិទានរឿងទន់ភ្លន់ពិរោះ</option>
                  <option value="Fenrir">⚡ Fenrir - តួឯកប្រុសភាពយន្ត</option>
                  <option value="Zephyr">🌸 Zephyr - តួឯកស្រីទន់ភ្លន់</option>
                  <option value="Puck">🎭 Puck - តួអង្គរស់រវើក</option>
                  <option value="Charon">🏛️ Charon - សំឡេងអធិប្បាយបុរាណធ្ងន់</option>
                </select>
              </div>
            </div>

            {/* Translation Tone */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {isKm ? 'រចនាបថសាច់រឿង (Storytelling Tone)' : 'Cinematic Tone'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'cinematic', labelKm: 'ភាពយន្តរំជួលចិត្ត', labelEn: 'Cinematic' },
                  { id: 'action', labelKm: 'សកម្មភាពមុតស្រួច', labelEn: 'Action' },
                  { id: 'legend', labelKm: 'រឿងព្រេងបុរាណ', labelEn: 'Legend' },
                  { id: 'casual', labelKm: 'សន្ទនាធម្មតា', labelEn: 'Casual' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition cursor-pointer ${
                      tone === t.id
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {isKm ? t.labelKm : t.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Speaker Gender Clone Option */}
            <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🎭</span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isKm ? 'បែងចែកសំឡេងតាមតួអង្គប្រុស/ស្រី (Multi-Speaker Gender Clone)' : 'Multi-Speaker Male & Female Clone'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {isKm
                      ? 'បើសំឡេងជាស្រី Clone ជាស្រី បើជាប្រុស Clone ជាប្រុស ត្រូវតាមសាច់រឿង'
                      : 'Route female voices to female AI, male voices to male AI'}
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={smartGenderClone}
                onChange={e => setSmartGenderClone(e.target.checked)}
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Auto-Mute Option */}
            <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isKm ? 'បិទសំឡេងដើមនៃវីដេអូដោយស្វ័យប្រវត្តិ' : 'Auto-Mute Original Video Track'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {isKm ? 'ដាក់សំឡេងបកប្រែថ្មីជំនួស មិនឱ្យជាន់គ្នានឹងសំឡេងដើម' : 'Silence original audio to hear dubbed voice cleanly'}
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={autoMuteOriginal}
                onChange={e => setAutoMuteOriginal(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Trigger Button */}
            <button
              onClick={handleStartPipeline}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isKm
                  ? 'ដំណើរការស្វ័យប្រវត្ត 3-in-1 (ទាញសំឡេង ➔ បកប្រែ ➔ បង្កើតសំឡេងថ្មី)'
                  : 'Start 3-in-1 Pipeline (Audio ➔ Text ➔ Voice)'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
