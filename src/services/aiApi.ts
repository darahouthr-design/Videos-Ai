import { SubtitleSegment } from '../types/subtitle';

export interface TranslationResult {
  segments: SubtitleSegment[];
}

export interface AutoCorrectResult {
  correctedSegments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    originalText: string;
    explanation?: string;
  }>;
  summary: string;
}

export interface TTSResult {
  audioBase64?: string;
  mimeType?: string;
  useBrowserSpeech?: boolean;
  status?: string;
  message?: string;
}

/**
 * Full Pipeline: Transcribe Audio -> Translate to Target Language
 */
export async function fetchAudioPipeline(
  audioBase64?: string,
  mimeType = 'audio/wav',
  targetLanguage = 'Khmer',
  tone = 'cinematic',
  videoDuration = 30,
  contextDescription = ''
): Promise<SubtitleSegment[]> {
  const res = await fetch('/api/ai/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      targetLanguage,
      tone,
      videoDuration,
      contextDescription,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process audio-to-text pipeline');
  }

  const data = await res.json();
  return data.segments || [];
}

/**
 * Call server endpoint to transcribe or auto-generate timestamps from audio/scene
 */
export async function fetchTranscribe(
  audioBase64?: string,
  mimeType?: string,
  contextDescription?: string,
  videoDuration?: number
): Promise<SubtitleSegment[]> {
  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      contextDescription,
      videoDuration,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to auto-generate subtitles');
  }

  const data = await res.json();
  return data.segments || [];
}

/**
 * Call server endpoint to translate subtitles
 */
export async function fetchTranslateSubtitles(
  segments: SubtitleSegment[],
  sourceLanguage: string,
  targetLanguage: string,
  tone: string = 'cinematic'
): Promise<SubtitleSegment[]> {
  const minimalSegments = segments.map(s => ({
    id: s.id,
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  const res = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segments: minimalSegments,
      sourceLanguage,
      targetLanguage,
      tone,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to translate subtitles');
  }

  const data = await res.json();
  return data.segments || [];
}

/**
 * Call server endpoint to auto-correct grammar, spelling, and phrasing
 */
export async function fetchAutoCorrectSubtitles(
  segments: SubtitleSegment[],
  language: string = 'Khmer'
): Promise<AutoCorrectResult> {
  const minimalSegments = segments.map(s => ({
    id: s.id,
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  const res = await fetch('/api/ai/autocorrect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segments: minimalSegments,
      language,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to auto-correct subtitles');
  }

  return await res.json();
}

/**
 * Call server endpoint to detect speaker genders and character roles across dialogue segments
 */
export async function fetchDetectGenders(
  segments: SubtitleSegment[],
  contextDescription = ''
): Promise<Array<{ id: string; speaker: string; speakerGender: 'male' | 'female'; voiceName: string }>> {
  const minimalSegments = segments.map(s => ({
    id: s.id,
    start: s.start,
    end: s.end,
    text: s.text,
    originalText: s.originalText,
  }));

  const res = await fetch('/api/ai/detect-genders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segments: minimalSegments,
      contextDescription,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze speaker genders');
  }

  const data = await res.json();
  return data.detected || [];
}

/**
 * Call server endpoint to generate high-quality TTS audio with male/female voice support
 */
export async function fetchDubbingTTS(
  text: string,
  voiceName: string = 'Kore',
  style: string = 'Cinematic emotional narrator',
  gender: 'male' | 'female' | 'auto' = 'auto'
): Promise<TTSResult> {
  try {
    const res = await fetch('/api/ai/dub-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName,
        style,
        gender,
      }),
    });

    if (!res.ok) {
      return { useBrowserSpeech: true, status: 'fallback' };
    }

    const data = await res.json();
    return data;
  } catch {
    return { useBrowserSpeech: true, status: 'fallback' };
  }
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeUtteranceResolve: (() => void) | null = null;

/**
 * Cancel any ongoing browser SpeechSynthesis immediately and completely
 */
export function stopBrowserVoice(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (activeUtterance) {
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
        activeUtterance = null;
      }
      if (activeUtteranceResolve) {
        const resolve = activeUtteranceResolve;
        activeUtteranceResolve = null;
        resolve();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      // Second cancel after a few milliseconds to clear any internal Chromium audio queue
      setTimeout(() => {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        } catch {}
      }, 15);
    } catch {
      // ignore
    }
  }
}

/**
 * Fallback browser SpeechSynthesis for instant local speaking when desired
 */
export function speakBrowserVoice(
  text: string,
  lang = 'km-KH',
  rate = 1.0,
  pitch = 1.0,
  gender: 'male' | 'female' | 'auto' = 'auto'
): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
    stopBrowserVoice();

    const clean = text.trim();
    if (!clean) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    activeUtterance = utterance;
    activeUtteranceResolve = resolve;

    utterance.lang = lang;
    utterance.rate = Math.min(2.2, Math.max(0.5, rate));

    // Dynamic pitch according to gender if not explicitly tuned
    let finalPitch = pitch;
    if (gender === 'female' && pitch === 1.0) {
      finalPitch = 1.25;
    } else if (gender === 'male' && pitch === 1.0) {
      finalPitch = 0.85;
    }
    utterance.pitch = finalPitch;

    const voices = window.speechSynthesis.getVoices();
    // Try to match language and gender if possible
    let match = voices.find(v => {
      const isLang = v.lang.startsWith(lang.substring(0, 2));
      if (!isLang) return false;
      if (gender === 'female') return /female|woman|girl|samantha|zira/i.test(v.name);
      if (gender === 'male') return /male|man|david|guy|george/i.test(v.name);
      return true;
    });

    if (!match) {
      match = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
    }
    if (match) utterance.voice = match;

    const finish = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      if (activeUtteranceResolve === resolve) {
        activeUtteranceResolve = null;
      }
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}


