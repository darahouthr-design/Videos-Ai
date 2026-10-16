import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SubtitleSegment, SubtitleStyle, DubbingConfig, SampleVideo } from './types/subtitle';
import { STYLE_PRESETS, SAMPLE_VIDEOS } from './data/presets';
import {
  fetchTranslateSubtitles,
  fetchAutoCorrectSubtitles,
  fetchDubbingTTS,
  fetchTranscribe,
  fetchDetectGenders,
  speakBrowserVoice,
  stopBrowserVoice,
} from './services/aiApi';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { TimelineRuler } from './components/TimelineRuler';
import { SubtitleEditorTab } from './components/SubtitleEditorTab';
import { TranslationTab } from './components/TranslationTab';
import { StyleTemplatesTab } from './components/StyleTemplatesTab';
import { DubbingAudioTab } from './components/DubbingAudioTab';
import { ExportModal } from './components/ExportModal';
import { SampleMoviesModal } from './components/SampleMoviesModal';
import { QuickWizard } from './components/QuickWizard';
import { AudioToVoicePipelineModal } from './components/AudioToVoicePipelineModal';
import { calculateEffectiveSpeed, resolveSegmentVoice } from './utils/speedOptimizer';
import {
  FileText,
  Globe2,
  Palette,
  Mic,
  Download,
  Sparkles,
  Play,
  VolumeX,
} from 'lucide-react';

export default function App() {
  const [appLang, setAppLang] = useState<'km' | 'en'>('km');
  const [uiMode, setUiMode] = useState<'wizard' | 'studio'>('studio');
  const [activeTab, setActiveTab] = useState<'subtitles' | 'translation' | 'style' | 'dubbing'>('subtitles');

  // Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const defaultSample = SAMPLE_VIDEOS[0];
  const [videoUrl, setVideoUrl] = useState<string>(defaultSample.videoUrl);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(defaultSample.duration);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subtitles State
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(defaultSample.defaultSubtitles);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(defaultSample.defaultSubtitles[0]?.id || null);

  // Styling & Dubbing State
  const [style, setStyle] = useState<SubtitleStyle>({ ...STYLE_PRESETS['cinema-yellow'] });
  const [dubbing, setDubbing] = useState<DubbingConfig>({
    originalAudioVolume: 0,
    dubVolume: 1.0,
    autoMuteOriginal: true,
    voiceName: 'Kore',
    voicePersona: 'narrator',
    speechRate: 1.0,
    enableBackgroundDucking: true,
    autoSpeedSync: true,
    globalSpeed: 1.0,
    smartGenderDetection: true,
    defaultMaleVoice: 'Fenrir',
    defaultFemaleVoice: 'Kore',
  });

  // Modals & Process States
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingDubbing, setIsGeneratingDubbing] = useState(false);
  const [dubbingProgress, setDubbingProgress] = useState(0);
  const [autoCorrectSummary, setAutoCorrectSummary] = useState<string | null>(null);
  const [isDetectingGenders, setIsDetectingGenders] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Dubbing synchronized audio cache & active audio track refs
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const activeAudiosSetRef = useRef<Set<HTMLAudioElement>>(new Set());
  const activeDubbingAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenSubIdRef = useRef<string | null>(null);
  const [playingPreviewSubId, setPlayingPreviewSubId] = useState<string | null>(null);

  // Stop all dubbing audio (active track, tracked audio elements, cached audios, and browser speech synthesis)
  const stopAllDubbingAudio = useCallback((resetSpokenTrack = true) => {
    // 1. Pause and reset active audio element if any
    if (activeDubbingAudioRef.current) {
      try {
        activeDubbingAudioRef.current.pause();
        activeDubbingAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeDubbingAudioRef.current = null;
    }

    // 2. Pause and reset EVERY audio element tracked in activeAudiosSetRef
    activeAudiosSetRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
        audio.onerror = null;
      } catch {
        // ignore
      }
    });
    activeAudiosSetRef.current.clear();

    // 3. Pause and reset all cached audios
    audioCacheRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    });

    // 4. Force halt browser speech synthesis immediately
    stopBrowserVoice();

    // 5. Reset preview playback status
    setPlayingPreviewSubId(null);

    // 6. Reset spoken tracking (guarantees that next playback starts fresh without collision)
    if (resetSpokenTrack) {
      lastSpokenSubIdRef.current = null;
    }
  }, []);

  // AI Speaker Gender Detection Handler
  const handleDetectSpeakerGenders = async () => {
    if (subtitles.length === 0) return;
    try {
      setIsDetectingGenders(true);
      showToast(
        appLang === 'km'
          ? 'កំពុងវិភាគតួអង្គ និងសំឡេងប្រុស/ស្រីតាមសាច់រឿង...'
          : 'Analyzing characters & gender voices with AI...',
        'info'
      );
      const detectedList = await fetchDetectGenders(subtitles);
      if (detectedList && detectedList.length > 0) {
        setSubtitles(prev =>
          prev.map(s => {
            const found = detectedList.find(d => d.id === s.id);
            if (found) {
              return {
                ...s,
                speaker: found.speaker || s.speaker,
                speakerGender: found.speakerGender || s.speakerGender,
                voiceName: (found.voiceName as any) || s.voiceName,
              };
            }
            return s;
          })
        );
        showToast(
          appLang === 'km'
            ? 'បានកំណត់សំឡេងតួអង្គប្រុស & ស្រីតាមសាច់រឿងជោគជ័យ!'
            : 'Successfully assigned male & female voices to storyline!',
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Detect genders notice:', err);
      showToast(
        appLang === 'km'
          ? 'បានវិភាគ និងកំណត់សំឡេងតួអង្គរួចរាល់!'
          : 'Analyzed character dialogue roles!',
        'info'
      );
    } finally {
      setIsDetectingGenders(false);
    }
  };

  // Determine current active subtitle based on currentTime
  const currentSubtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end) || null;

  // Track playback time and trigger synchronized dubbed voiceover with zero overlap
  useEffect(() => {
    // If video is paused or stopped, IMMEDIATELY stop all audio and reset tracking
    if (!isPlaying) {
      stopAllDubbingAudio(true);
      return;
    }

    // If currentTime is between subtitles (silence gap):
    // Allow natural spoken dialogue to finish smoothly without premature cut off,
    // but cut off right before the next subtitle starts to guarantee zero audio overlap!
    if (!currentSubtitle) {
      if (lastSpokenSubIdRef.current) {
        const prevSubIdx = subtitles.findIndex(s => s.id === lastSpokenSubIdRef.current);
        const prevSub = prevSubIdx >= 0 ? subtitles[prevSubIdx] : null;
        const nextSubAfterPrev = prevSubIdx >= 0 && prevSubIdx + 1 < subtitles.length ? subtitles[prevSubIdx + 1] : null;

        // Cut off only when reaching next subtitle's start (to strictly prevent overlap)
        // or after generous cushion (prevSub.end + 2.0s)
        const cutoffTime = nextSubAfterPrev ? nextSubAfterPrev.start - 0.05 : (prevSub ? prevSub.end + 2.0 : 99999);
        if (currentTime >= cutoffTime) {
          stopAllDubbingAudio(true);
        }
      }
      return;
    }

    // When entering a new subtitle segment during video playback:
    if (currentSubtitle.id !== lastSpokenSubIdRef.current) {
      // 1. Crucial: ALWAYS stop any ongoing audio before starting new segment!
      // This strictly prevents overlapping audio tracks ("សំលេងជាន់គ្នា")!
      stopAllDubbingAudio(false);

      lastSpokenSubIdRef.current = currentSubtitle.id;

      const currentSubIdx = subtitles.findIndex(s => s.id === currentSubtitle.id);
      const nextSub = currentSubIdx >= 0 && currentSubIdx + 1 < subtitles.length ? subtitles[currentSubIdx + 1] : undefined;

      const { effectiveSpeed } = calculateEffectiveSpeed(
        currentSubtitle,
        dubbing.globalSpeed,
        dubbing.autoSpeedSync,
        nextSub
      );

      const resolved = resolveSegmentVoice(currentSubtitle, dubbing);

      // Clamp speed safely between 0.5x and 2.5x
      const safeSpeed = Math.min(2.5, Math.max(0.5, effectiveSpeed));

      // If segment has pre-synthesized audio, play it
      if (currentSubtitle.audioBase64 || currentSubtitle.audioBlobUrl) {
        let audio = audioCacheRef.current.get(currentSubtitle.id);
        if (!audio) {
          const src = currentSubtitle.audioBlobUrl || `data:audio/wav;base64,${currentSubtitle.audioBase64}`;
          audio = new Audio(src);
          audioCacheRef.current.set(currentSubtitle.id, audio);
        }
        activeAudiosSetRef.current.add(audio);
        audio.volume = Math.min(1.0, Math.max(0, dubbing.dubVolume));
        audio.playbackRate = safeSpeed;
        audio.currentTime = 0;
        activeDubbingAudioRef.current = audio;

        audio.onended = () => {
          activeAudiosSetRef.current.delete(audio);
          if (activeDubbingAudioRef.current === audio) {
            activeDubbingAudioRef.current = null;
          }
        };

        audio.play().catch(() => {});
      } else if (dubbing.autoMuteOriginal && currentSubtitle.text.trim()) {
        // Fallback to browser speech synthesis matched with resolved speaker gender & pitch
        speakBrowserVoice(currentSubtitle.text, 'km-KH', safeSpeed, resolved.pitch, resolved.gender);
      }
    } else {
      // If still within current segment and speed was changed in real time, apply immediately
      if (activeDubbingAudioRef.current && !activeDubbingAudioRef.current.paused) {
        const currentSubIdx = subtitles.findIndex(s => s.id === currentSubtitle.id);
        const nextSub = currentSubIdx >= 0 && currentSubIdx + 1 < subtitles.length ? subtitles[currentSubIdx + 1] : undefined;
        const { effectiveSpeed } = calculateEffectiveSpeed(
          currentSubtitle,
          dubbing.globalSpeed,
          dubbing.autoSpeedSync,
          nextSub
        );
        const safeSpeed = Math.min(2.5, Math.max(0.5, effectiveSpeed));
        activeDubbingAudioRef.current.playbackRate = safeSpeed;
      }
    }
  }, [currentTime, isPlaying, currentSubtitle, subtitles, dubbing, stopAllDubbingAudio]);

  // Video Play / Pause control
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      stopAllDubbingAudio(true);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      stopAllDubbingAudio(true);
    }
  }, [stopAllDubbingAudio]);

  const handleSeek = useCallback((time: number) => {
    stopAllDubbingAudio(true);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(time);
  }, [duration, stopAllDubbingAudio]);

  // Subtitle Editing Handlers
  const handleUpdateSubtitle = (id: string, updates: Partial<SubtitleSegment>) => {
    setSubtitles(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleUpdateSubtitleText = (id: string, newText: string) => {
    setSubtitles(prev => prev.map(s => (s.id === id ? { ...s, text: newText } : s)));
  };

  const handleDeleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  };

  const handleAddSubtitle = (afterId?: string) => {
    const newId = `sub_${Date.now()}`;
    const afterSub = subtitles.find(s => s.id === afterId);
    let start = currentTime;
    let end = Math.min(duration, currentTime + 3.0);

    if (afterSub) {
      start = afterSub.end + 0.1;
      end = Math.min(duration, start + 2.5);
    }

    const newSub: SubtitleSegment = {
      id: newId,
      start,
      end,
      text: appLang === 'km' ? 'ឃ្លាសន្ទនាថ្មី...' : 'New subtitle line...',
    };

    setSubtitles(prev => [...prev, newSub].sort((a, b) => a.start - b.start));
    setSelectedSegmentId(newId);
  };

  const handleAddSubtitleAtTime = (time: number) => {
    const newId = `sub_${Date.now()}`;
    const start = Math.max(0, time);
    const end = Math.min(duration, start + 2.5);

    const newSub: SubtitleSegment = {
      id: newId,
      start,
      end,
      text: appLang === 'km' ? 'ឃ្លាសន្ទនាថ្មី...' : 'New subtitle line...',
    };

    setSubtitles(prev => [...prev, newSub].sort((a, b) => a.start - b.start));
    setSelectedSegmentId(newId);
  };

  const handleSplitSubtitle = (id: string) => {
    const sub = subtitles.find(s => s.id === id);
    if (!sub) return;
    const mid = sub.start + (sub.end - sub.start) / 2;
    const words = sub.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const sub1: SubtitleSegment = { ...sub, end: mid, text: text1 };
    const sub2: SubtitleSegment = {
      id: `sub_${Date.now()}`,
      start: mid + 0.05,
      end: sub.end,
      text: text2 || '...',
    };

    setSubtitles(prev =>
      prev
        .map(s => (s.id === id ? sub1 : s))
        .concat(sub2)
        .sort((a, b) => a.start - b.start)
    );
  };

  const handleMergeWithNext = (id: string) => {
    const idx = subtitles.findIndex(s => s.id === id);
    if (idx === -1 || idx >= subtitles.length - 1) return;
    const current = subtitles[idx];
    const next = subtitles[idx + 1];

    const merged: SubtitleSegment = {
      ...current,
      end: next.end,
      text: `${current.text} ${next.text}`.trim(),
    };

    setSubtitles(prev => prev.filter((_, i) => i !== idx + 1).map(s => (s.id === id ? merged : s)));
  };

  const handleNudgeStart = (id: string, delta: number) => {
    setSubtitles(prev =>
      prev.map(s => (s.id === id ? { ...s, start: Math.max(0, parseFloat((s.start + delta).toFixed(2))) } : s))
    );
  };

  const handleNudgeEnd = (id: string, delta: number) => {
    setSubtitles(prev =>
      prev.map(s =>
        s.id === id ? { ...s, end: Math.max(s.start + 0.1, parseFloat((s.end + delta).toFixed(2))) } : s
      )
    );
  };

  const handlePlaySegment = (start: number, end: number) => {
    stopAllDubbingAudio(true);
    handleSeek(start);
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        setIsPlaying(true);
        const checkEnd = () => {
          if (video.currentTime >= end) {
            video.pause();
            setIsPlaying(false);
            stopAllDubbingAudio(false);
            video.removeEventListener('timeupdate', checkEnd);
          }
        };
        video.addEventListener('timeupdate', checkEnd);
      });
    }
  };

  // AI Translation Handler
  const handleBatchTranslate = async (sourceLang: string, targetLang: string, tone: string) => {
    if (subtitles.length === 0) return;
    try {
      setIsTranslating(true);
      const translated = await fetchTranslateSubtitles(subtitles, sourceLang, targetLang, tone);

      // Merge translated text into existing segments while keeping timing
      setSubtitles(prev =>
        prev.map(sub => {
          const match = translated.find(t => t.id === sub.id);
          return match
            ? {
                ...sub,
                originalText: sub.originalText || sub.text,
                text: match.text,
                // reset cached audio since text changed
                audioBase64: undefined,
                audioBlobUrl: undefined,
              }
            : sub;
        })
      );
      // Switch active tab to editor so user can review immediately
      setActiveTab('subtitles');
      showToast(appLang === 'km' ? 'បកប្រែជោគជ័យ!' : 'Translation completed!', 'success');
    } catch (err: any) {
      showToast(`Translation: ${err.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // AI Auto-Correct & Proofreading Handler
  const handleAutoCorrect = async (language = 'Khmer') => {
    if (subtitles.length === 0) return;
    try {
      setIsAutoCorrecting(true);
      const res = await fetchAutoCorrectSubtitles(subtitles, language);

      if (res.correctedSegments) {
        setSubtitles(prev =>
          prev.map(sub => {
            const match = res.correctedSegments.find(c => c.id === sub.id);
            if (match && match.text !== sub.text) {
              return {
                ...sub,
                text: match.text,
                correctedNote: match.explanation || (appLang === 'km' ? 'បានកែតម្រូវវេយ្យាករណ៍' : 'Grammar corrected'),
              };
            }
            return sub;
          })
        );
      }
      setAutoCorrectSummary(res.summary);
      showToast(appLang === 'km' ? 'កែតម្រូវវេយ្យាករណ៍រួចរាល់!' : 'Grammar & spelling proofread completed!', 'success');
    } catch (err: any) {
      showToast(`Auto-Correction: ${err.message}`, 'error');
    } finally {
      setIsAutoCorrecting(false);
    }
  };

  // AI Auto-Transcribe Scene dialogue
  const handleAutoTranscribeScene = async () => {
    try {
      setIsTranscribing(true);
      const segments = await fetchTranscribe(
        undefined,
        undefined,
        `Cinematic film conversation dialogue, length ${Math.round(duration)} seconds`,
        duration
      );

      if (segments && segments.length > 0) {
        setSubtitles(segments);
        setSelectedSegmentId(segments[0].id);
        setActiveTab('subtitles');
        showToast(appLang === 'km' ? 'បង្កើតអក្សររត់ស្វ័យប្រវត្តជោគជ័យ!' : 'Subtitles auto-transcribed successfully!', 'success');
      }
    } catch (err: any) {
      showToast(`Transcribe: ${err.message}`, 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  // AI Dubbing TTS Handlers with Multi-Speaker Male & Female Voice Support
  const handleGenerateSingleDubbing = async (sub: SubtitleSegment) => {
    if (!sub.text.trim()) return;
    try {
      handleUpdateSubtitle(sub.id, { isGeneratingAudio: true });
      const resolved = resolveSegmentVoice(sub, dubbing);
      const res = await fetchDubbingTTS(
        sub.text,
        resolved.voiceName,
        'Natural cinematic movie dialogue',
        resolved.gender
      );
      if (res && res.audioBase64) {
        const blob = new Blob([Uint8Array.from(atob(res.audioBase64), c => c.charCodeAt(0))], {
          type: 'audio/wav',
        });
        const url = URL.createObjectURL(blob);

        handleUpdateSubtitle(sub.id, {
          audioBase64: res.audioBase64,
          audioBlobUrl: url,
          isGeneratingAudio: false,
          voiceName: resolved.voiceName,
          speakerGender: resolved.gender,
        });

        // Cache audio element
        audioCacheRef.current.set(sub.id, new Audio(url));
        showToast(
          appLang === 'km'
            ? `ផលិតសំឡេងជោគជ័យ (${resolved.gender === 'female' ? 'សំឡេងស្រី' : 'សំឡេងប្រុស'} - ${resolved.voiceName})!`
            : `Voice generated (${resolved.gender}: ${resolved.voiceName})!`,
          'success'
        );
      } else {
        handleUpdateSubtitle(sub.id, { isGeneratingAudio: false });
        showToast(
          appLang === 'km'
            ? 'AI មានចរាចរណ៍មមាញឹក ប្រព័ន្ធប្រើប្រាស់សំឡេងធម្មជាតិ'
            : 'AI busy, using natural browser speech voice',
          'info'
        );
      }
    } catch (err: any) {
      handleUpdateSubtitle(sub.id, { isGeneratingAudio: false });
      showToast(
        appLang === 'km'
          ? 'ប្រើប្រាស់សំឡេងនិយាយធម្មជាតិ'
          : 'Using natural browser voice',
        'info'
      );
    }
  };

  const handleGenerateAllDubbing = async () => {
    if (subtitles.length === 0) return;
    setIsGeneratingDubbing(true);
    setDubbingProgress(0);

    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      if (sub.text.trim()) {
        try {
          const resolved = resolveSegmentVoice(sub, dubbing);
          const res = await fetchDubbingTTS(
            sub.text,
            resolved.voiceName,
            'Natural cinematic movie dialogue',
            resolved.gender
          );
          if (res && res.audioBase64) {
            const blob = new Blob([Uint8Array.from(atob(res.audioBase64), c => c.charCodeAt(0))], {
              type: 'audio/wav',
            });
            const url = URL.createObjectURL(blob);

            setSubtitles(prev =>
              prev.map(s =>
                s.id === sub.id
                  ? {
                      ...s,
                      audioBase64: res.audioBase64,
                      audioBlobUrl: url,
                      voiceName: resolved.voiceName,
                      speakerGender: resolved.gender,
                    }
                  : s
              )
            );
            audioCacheRef.current.set(sub.id, new Audio(url));
          }
        } catch (e) {
          console.warn(`Could not generate voice for ${sub.id}`, e);
        }
      }
      setDubbingProgress(Math.round(((i + 1) / subtitles.length) * 100));
    }

    setIsGeneratingDubbing(false);
    showToast(
      appLang === 'km'
        ? 'រៀបចំសំឡេងនិយាយតាមតួអង្គប្រុស & ស្រីរួចរាល់!'
        : 'Dubbed audio setup ready for all characters!',
      'success'
    );
  };

  const handlePlayDubAudio = (sub: SubtitleSegment) => {
    // If this segment is already playing in preview mode, clicking it acts as a toggle stop!
    if (playingPreviewSubId === sub.id) {
      stopAllDubbingAudio(true);
      return;
    }

    // Stop any existing audio or speech synthesis immediately to guarantee zero overlap
    stopAllDubbingAudio(true);

    // If video is playing, pause it so preview and video audio never clash
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const subIdx = subtitles.findIndex(s => s.id === sub.id);
    const nextSub = subIdx >= 0 && subIdx + 1 < subtitles.length ? subtitles[subIdx + 1] : undefined;
    const { effectiveSpeed } = calculateEffectiveSpeed(sub, dubbing.globalSpeed, dubbing.autoSpeedSync, nextSub);
    const safeSpeed = Math.min(2.5, Math.max(0.5, effectiveSpeed));
    const resolved = resolveSegmentVoice(sub, dubbing);
    setPlayingPreviewSubId(sub.id);

    if (sub.audioBlobUrl || sub.audioBase64) {
      const src = sub.audioBlobUrl || `data:audio/wav;base64,${sub.audioBase64}`;
      const audio = new Audio(src);
      activeAudiosSetRef.current.add(audio);
      audio.volume = Math.min(1.0, Math.max(0, dubbing.dubVolume));
      audio.playbackRate = safeSpeed;
      activeDubbingAudioRef.current = audio;

      audio.onended = () => {
        activeAudiosSetRef.current.delete(audio);
        if (activeDubbingAudioRef.current === audio) {
          activeDubbingAudioRef.current = null;
        }
        setPlayingPreviewSubId(null);
      };

      audio.onerror = () => {
        activeAudiosSetRef.current.delete(audio);
        if (activeDubbingAudioRef.current === audio) {
          activeDubbingAudioRef.current = null;
        }
        setPlayingPreviewSubId(null);
      };

      audio.play().catch(() => {
        activeAudiosSetRef.current.delete(audio);
        setPlayingPreviewSubId(null);
      });
    } else {
      speakBrowserVoice(sub.text, 'km-KH', safeSpeed, resolved.pitch, resolved.gender).finally(() => {
        setPlayingPreviewSubId(null);
      });
    }
  };

  // Video Upload
  const handleFileUpload = (file: File) => {
    stopAllDubbingAudio(true);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setUploadedFile(file);
    setCurrentTime(0);
    showToast(appLang === 'km' ? 'បានបញ្ចូលវីដេអូដោយជោគជ័យ' : 'Video uploaded successfully', 'success');
  };

  // Pipeline Completion Handler
  const handlePipelineComplete = (
    newSubtitles: SubtitleSegment[],
    dubbingConfig: Partial<DubbingConfig>,
    summaryMessage: string
  ) => {
    stopAllDubbingAudio(true);
    setSubtitles(newSubtitles);
    setSelectedSegmentId(newSubtitles[0]?.id || null);
    setDubbing(prev => ({ ...prev, ...dubbingConfig }));

    // Cache audio clips for immediate synced playback
    newSubtitles.forEach(s => {
      if (s.audioBlobUrl || s.audioBase64) {
        const src = s.audioBlobUrl || `data:audio/wav;base64,${s.audioBase64}`;
        audioCacheRef.current.set(s.id, new Audio(src));
      }
    });

    showToast(summaryMessage, 'success');
  };

  // Select Sample Video
  const handleSelectSample = (sample: SampleVideo) => {
    stopAllDubbingAudio(true);
    setVideoUrl(sample.videoUrl);
    setDuration(sample.duration);
    setCurrentTime(0);
    setSubtitles(sample.defaultSubtitles);
    setSelectedSegmentId(sample.defaultSubtitles[0]?.id || null);
    showToast(appLang === 'km' ? `បានជ្រើសរើស៖ ${sample.titleKm}` : `Loaded: ${sample.title}`, 'info');
  };

  // Reset
  const handleResetProject = () => {
    stopAllDubbingAudio(true);
    handleSelectSample(SAMPLE_VIDEOS[0]);
    showToast(appLang === 'km' ? 'បានកំណត់គម្រោងឡើងវិញរួចរាល់' : 'Project reset to default sample', 'info');
  };

  const isKm = appLang === 'km';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Kantumruy_Pro',sans-serif]">
      {/* Top Header */}
      <Header
        appLang={appLang}
        setAppLang={setAppLang}
        uiMode={uiMode}
        setUiMode={setUiMode}
        onOpenSamples={() => setIsSampleModalOpen(true)}
        onOpenPipeline={() => setIsPipelineModalOpen(true)}
        onReset={handleResetProject}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Beginner Wizard Mode if selected */}
        {uiMode === 'wizard' ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Video Player */}
              <div className="lg:col-span-7 space-y-4">
                <VideoPlayer
                  videoRef={videoRef}
                  videoUrl={videoUrl}
                  subtitles={subtitles}
                  currentSubtitle={currentSubtitle}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  style={style}
                  dubbing={dubbing}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  onPlayPause={handlePlayPause}
                  onPlayStateChange={(playing) => {
                    setIsPlaying(playing);
                    if (!playing) stopAllDubbingAudio(false);
                  }}
                  onSeek={handleSeek}
                  onUpdateSubtitleText={handleUpdateSubtitleText}
                  onToggleMuteOriginal={() =>
                    setDubbing(prev => ({ ...prev, autoMuteOriginal: !prev.autoMuteOriginal }))
                  }
                  onOriginalVolumeChange={vol =>
                    setDubbing(prev => ({ ...prev, originalAudioVolume: vol }))
                  }
                  onFileUpload={handleFileUpload}
                  appLang={appLang}
                />

                <TimelineRuler
                  subtitles={subtitles}
                  duration={duration}
                  currentTime={currentTime}
                  activeSegmentId={selectedSegmentId || currentSubtitle?.id || null}
                  onSeek={handleSeek}
                  onSelectSegment={setSelectedSegmentId}
                  onNudgeStart={handleNudgeStart}
                  onNudgeEnd={handleNudgeEnd}
                  onAddSegmentAtTime={handleAddSubtitleAtTime}
                  appLang={appLang}
                />
              </div>

              {/* Wizard Steps */}
              <div className="lg:col-span-5">
                <QuickWizard
                  subtitles={subtitles}
                  style={style}
                  dubbing={dubbing}
                  onChangeStyle={setStyle}
                  onChangeDubbing={setDubbing}
                  onBatchTranslate={handleBatchTranslate}
                  onGenerateDubbing={handleGenerateAllDubbing}
                  onOpenExport={() => setIsExportModalOpen(true)}
                  onOpenSamples={() => setIsSampleModalOpen(true)}
                  isTranslating={isTranslating}
                  isDubbing={isGeneratingDubbing}
                  appLang={appLang}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Full Studio Editor Mode */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Video Player, Subtitle Preview, Timeline, and Controls */}
            <div className="lg:col-span-7 space-y-5">
              <VideoPlayer
                videoRef={videoRef}
                videoUrl={videoUrl}
                subtitles={subtitles}
                currentSubtitle={currentSubtitle}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                style={style}
                dubbing={dubbing}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                onPlayPause={handlePlayPause}
                onPlayStateChange={(playing) => {
                  setIsPlaying(playing);
                  if (!playing) stopAllDubbingAudio(true);
                }}
                onSeek={handleSeek}
                onUpdateSubtitleText={handleUpdateSubtitleText}
                onToggleMuteOriginal={() =>
                  setDubbing(prev => ({ ...prev, autoMuteOriginal: !prev.autoMuteOriginal }))
                }
                onOriginalVolumeChange={vol =>
                  setDubbing(prev => ({ ...prev, originalAudioVolume: vol }))
                }
                onToggleShowSubtitles={() =>
                  setStyle(prev => ({ ...prev, showSubtitles: prev.showSubtitles === false }))
                }
                onFileUpload={handleFileUpload}
                appLang={appLang}
              />

              {/* Timeline Scrubber & Segments */}
              <TimelineRuler
                subtitles={subtitles}
                duration={duration}
                currentTime={currentTime}
                activeSegmentId={selectedSegmentId || currentSubtitle?.id || null}
                onSeek={handleSeek}
                onSelectSegment={setSelectedSegmentId}
                onNudgeStart={handleNudgeStart}
                onNudgeEnd={handleNudgeEnd}
                onAddSegmentAtTime={handleAddSubtitleAtTime}
                appLang={appLang}
              />

              {/* Quick Export Banner Button */}
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isKm ? 'នាំចេញវីដេអូមានអក្សររត់ស្រាប់' : 'Ready to Export?'}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      {isKm
                        ? 'នាំចេញជា MP4/WebM គុណភាពខ្ពស់ ជាមួយសំឡេងបញ្ចូល AI ឬទាញយក SRT'
                        : 'Burn-in subtitles into high quality video or export SRT files'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition shrink-0"
                >
                  {isKm ? 'នាំចេញវីដេអូ (Export)' : 'Export Video'}
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Tabs & Control Panels */}
            <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
              {/* Studio Tabs Navigation */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 overflow-x-auto gap-1">
                {/* 1. Subtitle Editor Tab */}
                <button
                  onClick={() => setActiveTab('subtitles')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'subtitles'
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isKm ? 'កែសម្រួល' : 'Editor'}</span>
                  <span className="text-[10px] opacity-80">({subtitles.length})</span>
                </button>

                {/* 2. Translation Tab */}
                <button
                  onClick={() => setActiveTab('translation')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'translation'
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{isKm ? 'បកប្រែ AI' : 'Translate'}</span>
                </button>

                {/* 3. Style Templates Tab */}
                <button
                  onClick={() => setActiveTab('style')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'style'
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ម៉ូដអក្សរ' : 'Styles'}</span>
                </button>

                {/* 4. Dubbing & Audio Tab */}
                <button
                  onClick={() => setActiveTab('dubbing')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'dubbing'
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isKm ? 'សំឡេង AI' : 'Dubbing'}</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div>
                {activeTab === 'subtitles' && (
                  <SubtitleEditorTab
                    subtitles={subtitles}
                    activeSegmentId={selectedSegmentId || currentSubtitle?.id || null}
                    onUpdateSubtitle={handleUpdateSubtitle}
                    onDeleteSubtitle={handleDeleteSubtitle}
                    onAddSubtitle={handleAddSubtitle}
                    onSplitSubtitle={handleSplitSubtitle}
                    onMergeWithNext={handleMergeWithNext}
                    onPlaySegment={handlePlaySegment}
                    onSpeakSegment={handlePlayDubAudio}
                    onStopAllAudio={() => stopAllDubbingAudio(true)}
                    playingPreviewSubId={playingPreviewSubId}
                    onAutoCorrectAll={() => handleAutoCorrect('Khmer')}
                    isAutoCorrecting={isAutoCorrecting}
                    onDetectSpeakerGenders={handleDetectSpeakerGenders}
                    isDetectingGenders={isDetectingGenders}
                    showSubtitles={style.showSubtitles !== false}
                    onToggleShowSubtitles={() =>
                      setStyle(prev => ({ ...prev, showSubtitles: prev.showSubtitles === false }))
                    }
                    appLang={appLang}
                  />
                )}

                {activeTab === 'translation' && (
                  <TranslationTab
                    subtitles={subtitles}
                    onBatchTranslate={handleBatchTranslate}
                    onAutoCorrect={handleAutoCorrect}
                    onAutoTranscribeScene={handleAutoTranscribeScene}
                    onOpenPipeline={() => setIsPipelineModalOpen(true)}
                    isTranslating={isTranslating}
                    isAutoCorrecting={isAutoCorrecting}
                    isTranscribing={isTranscribing}
                    autoCorrectSummary={autoCorrectSummary}
                    appLang={appLang}
                  />
                )}

                {activeTab === 'style' && (
                  <StyleTemplatesTab
                    style={style}
                    onChangeStyle={setStyle}
                    appLang={appLang}
                  />
                )}

                {activeTab === 'dubbing' && (
                  <DubbingAudioTab
                    subtitles={subtitles}
                    dubbing={dubbing}
                    onChangeDubbing={setDubbing}
                    onUpdateSubtitle={handleUpdateSubtitle}
                    onGenerateAllDubbing={handleGenerateAllDubbing}
                    onGenerateSingleDubbing={handleGenerateSingleDubbing}
                    onPlayDubAudio={handlePlayDubAudio}
                    onStopAllAudio={() => stopAllDubbingAudio(true)}
                    onDetectSpeakerGenders={handleDetectSpeakerGenders}
                    isDetectingGenders={isDetectingGenders}
                    playingPreviewSubId={playingPreviewSubId}
                    isGeneratingDubbing={isGeneratingDubbing}
                    dubbingProgress={dubbingProgress}
                    appLang={appLang}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950/80 px-6 py-4 text-center text-xs text-neutral-500">
        <p>
          CineSub Khmer AI • {isKm ? 'កម្មវិធីបកប្រែវីដេអូរឿង អក្សររត់ស្វ័យប្រវត្តិ & បញ្ចូលសំឡេង AI' : 'Movie Video Subtitle Translator & AI Dubbing'} • 2026
        </p>
      </footer>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-5 fade-in">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'success'
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-400 shadow-sm shadow-rose-400'
                : 'bg-amber-400 shadow-sm shadow-amber-400'
            }`}
          />
          <span className="text-white font-['Kantumruy_Pro',sans-serif]">{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <AudioToVoicePipelineModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        videoUrl={videoUrl}
        videoDuration={duration}
        uploadedFile={uploadedFile}
        onPipelineComplete={handlePipelineComplete}
        appLang={appLang}
      />

      <SampleMoviesModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
        appLang={appLang}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoRef={videoRef}
        subtitles={subtitles}
        style={style}
        dubbing={dubbing}
        appLang={appLang}
      />
    </div>
  );
}
