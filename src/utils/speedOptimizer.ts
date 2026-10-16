import { SubtitleSegment, DubbingConfig, SpeakerGender } from '../types/subtitle';

/**
 * Estimate natural spoken duration (in seconds) for movie dialogue.
 * Takes into account Khmer script character density, syllable count, and punctuation pauses.
 */
export function estimateSpokenDuration(text: string): number {
  const clean = text.trim();
  if (!clean) return 1.0;

  // Check if primarily Khmer (Unicode \u1780-\u17FF)
  const isKhmer = /[\u1780-\u17FF]/.test(clean);

  if (isKhmer) {
    // Normal Khmer speech cadence is ~10 to 13 characters per second (including vowels & diacritics)
    // Plus short pause for punctuation / sentence endings
    const charCount = clean.replace(/\s+/g, '').length;
    const baseDuration = charCount / 11.5;
    const pauseCount = (clean.match(/[។៕,\.\?!]/g) || []).length;
    return Math.max(1.0, parseFloat((baseDuration + pauseCount * 0.35).toFixed(2)));
  }

  // Latin / other languages: average ~2.6 words per second
  const words = clean.split(/\s+/).filter(Boolean);
  const baseDuration = words.length / 2.6;
  const pauseCount = (clean.match(/[,\.\?!;:]/g) || []).length;
  return Math.max(1.0, parseFloat((baseDuration + pauseCount * 0.3).toFixed(2)));
}

/**
 * Calculate the effective playback speed for a subtitle segment.
 * If autoSpeedSync is enabled, calculates the exact speed multiplier needed to fit
 * the speech within the scene's available duration [start -> end] or before the next segment.
 * Ensures the speech finishes completely ("សំលេងនិយាយអស់មិនកាត់") and never overlaps ("មិនជាន់គ្នារ").
 */
export function calculateEffectiveSpeed(
  segment: SubtitleSegment,
  globalSpeed = 1.0,
  globalAutoSync = true,
  nextSegment?: SubtitleSegment
): { effectiveSpeed: number; isAuto: boolean; estimatedDuration: number; availableTime: number } {
  // Base duration of current segment
  const baseSegmentDuration = Math.max(0.5, segment.end - segment.start);

  // If next segment exists and starts after this segment's start,
  // allow natural breathing room up to nextSegment.start - 0.08s
  const availableTime = nextSegment && nextSegment.start > segment.start
    ? Math.max(baseSegmentDuration, nextSegment.start - segment.start - 0.08)
    : baseSegmentDuration;

  const estimatedDuration = segment.audioDuration || estimateSpokenDuration(segment.text);

  // Check if auto speed is enabled for this segment
  const isAuto = segment.autoSpeedSync ?? globalAutoSync;

  if (isAuto) {
    // To ensure the sentence finishes 100% completely without being cut off,
    // we calculate required speed to comfortably fit within available window:
    const idealSpeed = (estimatedDuration + 0.1) / availableTime;

    // Allow speed to scale between 0.75x and 2.2x so long dialogue can finish smoothly
    const clampedSpeed = Math.min(2.2, Math.max(0.75, idealSpeed));
    const effective = parseFloat((clampedSpeed * globalSpeed).toFixed(2));

    return {
      effectiveSpeed: effective,
      isAuto: true,
      estimatedDuration,
      availableTime,
    };
  }

  // Manual speed
  const manual = segment.playbackSpeed || globalSpeed;
  return {
    effectiveSpeed: parseFloat(manual.toFixed(2)),
    isAuto: false,
    estimatedDuration,
    availableTime,
  };
}

/**
 * Detect speaker gender from text cues, honorifics, and character indicators (Khmer & English)
 */
export function detectGenderFromText(text: string, originalText?: string): 'male' | 'female' {
  const combined = `${text} ${originalText || ''}`.toLowerCase();

  // Female indicator keywords (Khmer: នាង, កញ្ញា, ចា៎, ចាស, ម៉ែ, ម្ដាយ, អូន, យាយ | En: she, her, woman, girl, lady, miss)
  const femalePattern = /(នាង|កញ្ញា|ចា៎|ចាស|ម៉ែ|ម្ដាយ|យាយ|អូន|អ្នកគ្រូ|ព្រះនាង|\bshe\b|\bher\b|\bwoman\b|\bgirl\b|\blady\b|\bmiss\b|\bmrs\b)/i;
  
  // Male indicator keywords (Khmer: បង, លោក, ឪ, ឪពុក, បាទ, តា, កម្លោះ, ព្រះអង្គ, បុរស | En: he, him, his, man, boy, mr, sir)
  const malePattern = /(បង|លោក|ឪ|ឪពុក|តា|កម្លោះ|បាទ|បុរស|លោកគ្រូ|ព្រះអង្គ|\bhe\b|\bhim\b|\bhis\b|\bman\b|\bboy\b|\bmr\b|\bsir\b)/i;

  const hasFemale = femalePattern.test(combined);
  const hasMale = malePattern.test(combined);

  if (hasFemale && !hasMale) return 'female';
  if (hasMale && !hasFemale) return 'male';

  return 'male'; // default neutral fallback
}

/**
 * Resolve the final AI voice, speaker gender, and audio pitch for a subtitle segment
 */
export function resolveSegmentVoice(
  segment: SubtitleSegment,
  dubbing: DubbingConfig
): {
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  gender: 'male' | 'female';
  pitch: number;
} {
  let gender: 'male' | 'female';

  if (segment.speakerGender === 'male' || segment.speakerGender === 'female') {
    gender = segment.speakerGender;
  } else if (dubbing.smartGenderDetection) {
    gender = detectGenderFromText(segment.text, segment.originalText);
  } else {
    // Based on the global voice persona
    const femaleVoices = ['Kore', 'Zephyr'];
    gender = femaleVoices.includes(dubbing.voiceName) ? 'female' : 'male';
  }

  // Voice name resolution
  let chosenVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

  if (segment.voiceName && segment.voiceName !== 'auto') {
    chosenVoice = segment.voiceName;
  } else if (gender === 'female') {
    chosenVoice = dubbing.defaultFemaleVoice || 'Kore';
  } else {
    chosenVoice = dubbing.defaultMaleVoice || 'Fenrir';
  }

  // Pitch for browser speech synthesis
  const pitch = gender === 'female' ? 1.25 : 0.85;

  return {
    voiceName: chosenVoice,
    gender,
    pitch,
  };
}

/**
 * Measure Audio duration from an audio blob/url
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = audioUrl;
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration || 1.0);
    });
    audio.addEventListener('error', () => {
      resolve(1.0);
    });
  });
}

