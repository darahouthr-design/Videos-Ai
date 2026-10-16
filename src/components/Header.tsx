import React from 'react';
import { Film, Sparkles, Globe2, Wand2, Sliders, FolderOpen, RefreshCw } from 'lucide-react';

interface HeaderProps {
  appLang: 'km' | 'en';
  setAppLang: (lang: 'km' | 'en') => void;
  uiMode: 'wizard' | 'studio';
  setUiMode: (mode: 'wizard' | 'studio') => void;
  onOpenSamples: () => void;
  onOpenPipeline: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appLang,
  setAppLang,
  uiMode,
  setUiMode,
  onOpenSamples,
  onOpenPipeline,
  onReset,
}) => {
  const isKm = appLang === 'km';

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-neutral-950 shadow-lg shadow-amber-500/20">
            <Film className="w-5 h-5 stroke-[2.2]" />
            <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-['Kantumruy_Pro',sans-serif]">
                CineSub <span className="text-amber-400">Khmer AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">
                {isKm ? 'ជំនាន់ AI ភាពយន្ត' : 'Movie AI Pro'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              {isKm 
                ? 'បកប្រែវីដេអូរឿង • អក្សររត់ស្វ័យប្រវត្តិ • បញ្ចូលសំឡេង AI • នាំចេញគុណភាពខ្ពស់' 
                : 'Auto Video Subtitle Translator, AI Dubbing & Burn-in Studio'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1-Click Pipeline Button */}
          <button
            onClick={onOpenPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
            title={isKm ? 'ទាញសំឡេងជាអក្សរ ➔ បកប្រែ ➔ បង្កើតសំឡេងថ្មី' : 'Audio-to-Text ➔ Translate ➔ Dubbing'}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>{isKm ? 'ដំណើរការស្វ័យប្រវត្ត 3-in-1' : '3-in-1 Pipeline'}</span>
          </button>

          {/* Sample Movies Button */}
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isKm ? 'វីដេអូគំរូ' : 'Sample Movies'}</span>
          </button>

          {/* Mode Switcher: Wizard vs Studio */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setUiMode('wizard')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                uiMode === 'wizard'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title={isKm ? 'ផ្ទាំងងាយស្រួលប្រើមួយជំហានៗ' : 'Step-by-step easy wizard'}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isKm ? 'អ្នកចាប់ផ្តើម' : 'Easy'}</span>
            </button>
            <button
              onClick={() => setUiMode('studio')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                uiMode === 'studio'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title={isKm ? 'ស្ទូឌីយោពេញលេញ' : 'Full Studio Editor'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isKm ? 'ស្ទូឌីយោ' : 'Studio'}</span>
            </button>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setAppLang(appLang === 'km' ? 'en' : 'km')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition"
            title="ប្តូរភាសា / Switch Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold">{appLang === 'km' ? 'ខ្មែរ (KM)' : 'EN'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
            title={isKm ? 'កំណត់ឡើងវិញ' : 'Reset Project'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
