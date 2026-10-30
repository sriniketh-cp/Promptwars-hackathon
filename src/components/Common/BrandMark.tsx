import React from 'react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3">
      {/* Brand Icon: Deep plum crest with warm gold spark and coral arc */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#2D112C] via-[#3B1838] to-[#1E0B24] flex items-center justify-center shadow-md shadow-[#2D112C]/20 border border-[#D4AF37]/30 relative overflow-hidden group shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-5/6 h-5/6 transition-transform duration-300 group-hover:scale-110"
        >
          {/* Subtle gold celebration halo */}
          <circle cx="16" cy="16" r="11" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
          {/* Coral celebration ribbon swirl */}
          <path
            d="M8 20C10 13 22 13 24 20C21 23 11 23 8 20Z"
            fill="url(#festivo-coral-grad)"
            opacity="0.85"
          />
          {/* Central gold milestone star */}
          <path
            d="M16 6L17.5 12.5L24 14L17.5 15.5L16 22L14.5 15.5L8 14L14.5 12.5L16 6Z"
            fill="#F4DE86"
          />
          <circle cx="16" cy="14" r="1.5" fill="#2D112C" />
          <defs>
            <linearGradient id="festivo-coral-grad" x1="8" y1="13" x2="24" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F97356" />
              <stop offset="1" stopColor="#E0533C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif font-bold tracking-tight text-[#2D112C] ${textSizes[size]}`}>
            Festivo
          </span>
          <span className="font-sans font-extrabold text-[0.65rem] tracking-wider text-[#E0533C] uppercase px-1.5 py-0.5 rounded bg-[#FAF0ED] border border-[#F97356]/20">
            AI
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-[#6B5E62] font-medium tracking-tight mt-0.5">
            Plan smarter. Celebrate better.
          </p>
        )}
      </div>
    </div>
  );
};
