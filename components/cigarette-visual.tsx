'use client';

import { useEffect, useState } from 'react';

interface CigaretteVisualProps {
  count: number;
  maxDisplay?: number;
}

export function CigaretteVisual({ count, maxDisplay = 10 }: CigaretteVisualProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const displayCount = Math.min(Math.ceil(count), maxDisplay);
  
  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= displayCount) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, [displayCount]);

  return (
    <div className="flex flex-wrap justify-center gap-2 py-4">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className={`transition-all duration-500 ${
            i < visibleCount ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          <svg
            width="40"
            height="12"
            viewBox="0 0 40 12"
            className="drop-shadow-lg"
          >
            {/* Filter */}
            <rect x="0" y="2" width="10" height="8" rx="1" fill="#D97706" />
            <rect x="0" y="2" width="10" height="8" rx="1" fill="url(#filterPattern)" opacity="0.3" />
            
            {/* Paper */}
            <rect x="10" y="1" width="28" height="10" rx="1" fill="#F5F5F5" />
            
            {/* Burning tip */}
            <rect x="35" y="1" width="5" height="10" rx="1" fill="#EF4444" />
            <rect x="36" y="2" width="3" height="8" rx="1" fill="#F97316" className="animate-pulse" />
            
            {/* Smoke */}
            <g className="animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
              <ellipse cx="39" cy="-2" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
              <ellipse cx="41" cy="-5" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />
            </g>
            
            <defs>
              <pattern id="filterPattern" patternUnits="userSpaceOnUse" width="2" height="2">
                <circle cx="1" cy="1" r="0.5" fill="#92400E" />
              </pattern>
            </defs>
          </svg>
        </div>
      ))}
      
      {count > maxDisplay && (
        <div className="flex items-center justify-center w-10 h-12 text-muted-foreground text-sm font-medium">
          +{Math.ceil(count - maxDisplay)}
        </div>
      )}
    </div>
  );
}
