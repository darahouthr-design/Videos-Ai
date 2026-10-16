import React from 'react';
import { SubtitleStyle, SubtitlePresetId } from '../types/subtitle';
import { STYLE_PRESETS, AVAILABLE_FONTS } from '../data/presets';
import {
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Subtitles,
} from 'lucide-react';

interface StyleTemplatesTabProps {
  style: SubtitleStyle;
  onChangeStyle: (newStyle: SubtitleStyle) => void;
  appLang: 'km' | 'en';
}

export const StyleTemplatesTab: React.FC<StyleTemplatesTabProps> = ({
  style,
  onChangeStyle,
  appLang,
}) => {
  const isKm = appLang === 'km';

  const presetsList: Array<{
    id: SubtitlePresetId;
    titleKm: string;
    titleEn: string;
    descKm: string;
    previewBg: string;
    textColor: string;
  }> = [
    {
      id: 'netflix',
      titleKm: '🎬 Netflix ភាពយន្តស្តង់ដារ',
      titleEn: 'Netflix Cinematic',
      descKm: 'អក្សរសរលោង ប្រអប់ខ្មៅស្រាល មើលច្បាស់គ្រប់ឈុត',
      previewBg: 'bg-neutral-900',
      textColor: '#FFFFFF',
    },
    {
      id: 'tiktok',
      titleKm: '🌟 TikTok & Reels បែបពេញនិយម',
      titleEn: 'TikTok / Reels Viral',
      descKm: 'អក្សរពណ៌លឿងដិត គែមខ្មៅក្រាស់ ចាប់អារម្មណ៍ខ្លាំង',
      previewBg: 'bg-neutral-950',
      textColor: '#FFE600',
    },
    {
      id: 'cinema-yellow',
      titleKm: '📽️ ភាពយន្តបុរាណ Cinema Gold',
      titleEn: 'Classic Cinema Gold',
      descKm: 'រចនាបថភាពយន្តហូលីវូដបុរាណ ពណ៌មាសលឿងឆើត',
      previewBg: 'bg-neutral-900',
      textColor: '#F5DE38',
    },
    {
      id: 'khmer-moul',
      titleKm: '🇰🇭 អក្សរមូលប្រពៃណីខ្មែរ',
      titleEn: 'Royal Khmer Moul',
      descKm: 'អក្សរមូលរាជវាំង ដ៏ប្រណីតសម្រាប់រឿងភាគបុរាណ',
      previewBg: 'bg-amber-950/40',
      textColor: '#F6E05E',
    },
    {
      id: 'neon',
      titleKm: '💎 Neon Cyberpunk ពន្លឺភ្លឺចែងចាំង',
      titleEn: 'Neon Glow',
      descKm: 'ពណ៌ខៀវខ្ចីភ្លឺរលោង សមស្របរឿងវិទ្យាសាស្ត្រ',
      previewBg: 'bg-slate-950',
      textColor: '#00F0FF',
    },
    {
      id: 'minimal',
      titleKm: '🎞️ ទំនើបស្អាតសាមញ្ញ Minimalist',
      titleEn: 'Minimal Clean',
      descKm: 'អក្សរពណ៌សស្អាត គ្មានប្រអប់ ស្រាលភ្នែក',
      previewBg: 'bg-neutral-900',
      textColor: '#F8FAFC',
    },
    {
      id: 'comic',
      titleKm: '🎨 តុក្កតា & Anime Comic',
      titleEn: 'Animation & Comic',
      descKm: 'ប្រអប់ក្រហមដិត សមស្របតុក្កតានិងរឿងកំប្លែង',
      previewBg: 'bg-red-950/40',
      textColor: '#FFFFFF',
    },
  ];

  const handleApplyPreset = (presetId: SubtitlePresetId) => {
    const template = STYLE_PRESETS[presetId];
    if (template) {
      onChangeStyle({ ...template });
    }
  };

  const update = (partial: Partial<SubtitleStyle>) => {
    onChangeStyle({ ...style, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* 0. Subtitle Overlay Visibility (Show/Hide Subtitles - បិទអក្សររត់) */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                style.showSubtitles !== false
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {style.showSubtitles !== false ? (
                <Subtitles className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {isKm ? 'បង្ហាញ ឬបិទអក្សររត់លើវីដេអូ' : 'Video Subtitles Visibility'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    style.showSubtitles !== false
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {style.showSubtitles !== false
                    ? (isKm ? 'កំពុងបើកបង្ហាញ' : 'Visible (ON)')
                    : (isKm ? 'បានបិទអក្សររត់' : 'Hidden (OFF)')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-['Kantumruy_Pro',sans-serif]">
                {style.showSubtitles !== false
                  ? (isKm
                      ? 'អក្សររត់កំពុងបង្ហាញលើវីដេអូ។ អ្នកអាចចុចបិទបានប្រសិនបើមិនចង់ឱ្យមានអក្សររត់។'
                      : 'Subtitles are actively displayed over the video.')
                  : (isKm
                      ? 'អក្សររត់ត្រូវបានបិទលើវីដេអូ ប៉ុន្តែសំឡេង AI នៅតែដំណើរការធម្មតា។'
                      : 'Subtitles are hidden from video overlay while voice dubbing continues.')}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={style.showSubtitles !== false}
              onChange={e => update({ showSubtitles: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* 1. Presets Showcase */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-neutral-200">
            {isKm ? 'គំរូម៉ូដអក្សររត់ស្អាតៗ (Preset Styles)' : 'Cinematic Style Presets'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presetsList.map(item => {
            const isSelected = style.preset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleApplyPreset(item.id)}
                className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-neutral-900/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">
                    {isKm ? item.titleKm : item.titleEn}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold">
                      {isKm ? 'កំពុងប្រើ' : 'Active'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                  {item.descKm}
                </p>

                {/* Mini Preview Box */}
                <div
                  className={`py-2 px-3 rounded-lg flex items-center justify-center border border-neutral-800/80 ${item.previewBg}`}
                >
                  <span
                    style={{ color: item.textColor }}
                    className="text-xs font-semibold tracking-wide font-['Kantumruy_Pro',sans-serif]"
                  >
                    {isKm ? 'គំរូអក្សររត់ភាពយន្ត 2026' : 'Sample Movie Subtitle'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Fine-Tuning Controls */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-neutral-200">
            {isKm ? 'កែសម្រួលម៉ូដអក្សរដោយផ្ទាល់ (Custom Fine-Tuning)' : 'Subtitle Customization'}
          </h4>
        </div>

        {/* Font Family Selection */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            {isKm ? 'ប្រភេទពុម្ពអក្សរ (Font Family)' : 'Font Family'}
          </label>
          <select
            value={style.fontFamily}
            onChange={e => update({ fontFamily: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {AVAILABLE_FONTS.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size & Position Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
              <span>{isKm ? 'ទំហំអក្សរ (Font Size)' : 'Font Size'}</span>
              <span className="font-mono text-amber-400">{style.fontSize}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="52"
              value={style.fontSize}
              onChange={e => update({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
              <span>{isKm ? 'គម្លាតពីបាតក្រោម (Vertical Position)' : 'Position From Bottom'}</span>
              <span className="font-mono text-amber-400">{style.positionY}%</span>
            </div>
            <input
              type="range"
              min="4"
              max="70"
              value={style.positionY}
              onChange={e => update({ positionY: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Colors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Text Color */}
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              {isKm ? 'ពណ៌អក្សរ' : 'Text Color'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.textColor}
                onChange={e => update({ textColor: e.target.value })}
                className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
              />
              <span className="font-mono text-xs text-neutral-200">{style.textColor}</span>
            </div>
          </div>

          {/* Stroke / Outline */}
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                {isKm ? 'គែមអក្សរ (Stroke)' : 'Outline'}
              </label>
              <span className="text-[10px] font-mono text-neutral-500">{style.strokeWidth}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.strokeColor}
                onChange={e => update({ strokeColor: e.target.value })}
                className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
              />
              <input
                type="range"
                min="0"
                max="8"
                value={style.strokeWidth}
                onChange={e => update({ strokeWidth: parseInt(e.target.value) })}
                className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Background Box Opacity */}
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                {isKm ? 'ប្រអប់ផ្ទៃក្រោយ' : 'Box Opacity'}
              </label>
              <span className="text-[10px] font-mono text-neutral-500">
                {Math.round(style.backgroundOpacity * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.backgroundColor}
                onChange={e => update({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={style.backgroundOpacity}
                onChange={e => update({ backgroundOpacity: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Alignment & Styles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Alignment */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => update({ alignment: 'left' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'left' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => update({ alignment: 'center' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'center' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => update({ alignment: 'right' })}
              className={`p-1.5 rounded-lg transition ${
                style.alignment === 'right' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bold & Italic */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => update({ bold: !style.bold })}
              className={`p-1.5 rounded-lg transition ${
                style.bold ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => update({ italic: !style.italic })}
              className={`p-1.5 rounded-lg transition ${
                style.italic ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
