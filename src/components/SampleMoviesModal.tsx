import React from 'react';
import { SAMPLE_VIDEOS } from '../data/presets';
import { SampleVideo } from '../types/subtitle';
import { Film, Play, X, Clock, Sparkles } from 'lucide-react';

interface SampleMoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleVideo) => void;
  appLang: 'km' | 'en';
}

export const SampleMoviesModal: React.FC<SampleMoviesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  appLang,
}) => {
  const isKm = appLang === 'km';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isKm ? 'ជ្រើសរើសវីដេអូរឿងគំរូសម្រាប់សាកល្បង' : 'Select a Sample Movie Scene'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isKm
                  ? 'សាកល្បងមុខងារបកប្រែ អក្សររត់ និងបញ្ចូលសំឡេង AI ភ្លាមៗជាមួយវីដេអូគុណភាពខ្ពស់'
                  : 'Instantly test translation, auto-subtitling, and voice dubbing with preloaded clips'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_VIDEOS.map(video => (
            <div
              key={video.id}
              className="group bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/60 rounded-xl overflow-hidden transition-all flex flex-col justify-between"
            >
              {/* Thumbnail image with play overlay */}
              <div className="relative aspect-video overflow-hidden bg-neutral-950">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-neutral-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {video.duration}s
                </div>
              </div>

              {/* Info & Select Button */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1 block">
                    {isKm ? video.categoryKm : video.category}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1 mb-1 font-['Kantumruy_Pro',sans-serif]">
                    {isKm ? video.titleKm : video.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-3 font-['Kantumruy_Pro',sans-serif]">
                    {video.descriptionKm}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectSample(video);
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ជ្រើសរើសឈុតនេះ' : 'Use This Scene'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
