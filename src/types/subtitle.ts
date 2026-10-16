export type SpeakerGender = 'male' | 'female' | 'auto';

export interface SubtitleSegment {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  originalText?: string;
  audioBase64?: string;
  audioBlobUrl?: string;
  isGeneratingAudio?: boolean;
  correctedNote?: string;
  playbackSpeed?: number;    // Manual speed (e.g. 0.8 to 2.0)
  autoSpeedSync?: boolean;   // Whether to auto-calculate speed to fit segment duration
  calculatedSpeed?: number;  // The calculated effective speed
  audioDuration?: number;    // Raw duration of the generated audio in seconds
  speaker?: string;          // Speaker name/label e.g. "Male Speaker", "Female Speaker", "តួប្រុស", "តួស្រី"
  speakerGender?: SpeakerGender; // 'male' | 'female' | 'auto'
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'auto'; // Specific voice for this segment
}

export type SubtitlePresetId = 
  | 'netflix'
  | 'tiktok'
  | 'cinema-yellow'
  | 'khmer-moul'
  | 'neon'
  | 'minimal'
  | 'comic';

export interface SubtitleStyle {
  preset: SubtitlePresetId;
  fontFamily: string;
  fontSize: number;       // in pixels
  textColor: string;      // hex
  backgroundColor: string; // hex
  backgroundOpacity: number; // 0 to 1
  strokeColor: string;
  strokeWidth: number;    // 0 to 8
  shadowColor: string;
  shadowBlur: number;
  positionY: number;      // percentage from bottom (e.g. 10)
  alignment: 'center' | 'left' | 'right';
  bold: boolean;
  italic: boolean;
  showSubtitles?: boolean; // When false, subtitles overlay is hidden ("បិទអក្សររត់")
}

export interface DubbingConfig {
  originalAudioVolume: number; // 0 (mute) to 1 (full)
  dubVolume: number;           // 0 to 1.5
  autoMuteOriginal: boolean;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  voicePersona: 'narrator' | 'hero' | 'heroine' | 'dramatic' | 'documentary';
  speechRate: number;          // 0.8 to 1.4
  enableBackgroundDucking: boolean;
  autoSpeedSync: boolean;      // Auto adjust speech speed to fit dialogue scene duration
  globalSpeed: number;         // Global manual speed multiplier (0.5 to 2.0)
  smartGenderDetection: boolean; // Auto detect male/female speakers from storyline
  defaultMaleVoice: 'Fenrir' | 'Puck' | 'Charon';   // Default voice for male dialogue
  defaultFemaleVoice: 'Kore' | 'Zephyr';            // Default voice for female dialogue
}

export interface SampleVideo {
  id: string;
  title: string;
  titleKm: string;
  category: string;
  categoryKm: string;
  duration: number;
  videoUrl: string;
  thumbnail: string;
  descriptionKm: string;
  defaultSubtitles: SubtitleSegment[];
}

export interface TranslationLanguage {
  code: string;
  name: string;
  nameKm: string;
  flag: string;
}
