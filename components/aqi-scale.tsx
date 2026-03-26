'use client';

import { type AQILevelSummary } from '@/lib/aqi-types';

interface AQIScaleProps {
  currentAqi: number;
  levels: AQILevelSummary[];
}

export function AQIScale({ currentAqi, levels }: AQIScaleProps) {
  const percentage = Math.min((currentAqi / 500) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>0</span>
        <span>AQI Scale</span>
        <span>500</span>
      </div>
      
      <div className="relative h-4 rounded-full overflow-hidden bg-secondary">
        {/* Gradient bar */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              #22c55e 0%, 
              #22c55e 10%, 
              #eab308 20%, 
              #f97316 30%, 
              #ef4444 40%, 
              #a855f7 60%, 
              #7f1d1d 100%
            )`
          }}
        />
        
        {/* Current position indicator */}
        <div 
          className="absolute top-0 w-1 h-full bg-foreground shadow-lg transition-all duration-700 ease-out"
          style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
            {currentAqi}
          </div>
        </div>
      </div>
      
      {/* Level labels */}
      <div className="flex justify-between gap-1 text-xs">
        {levels.map((level, i) => (
          <div 
            key={level.category}
            className="flex-1 text-center truncate"
            style={{ color: level.color }}
          >
            <span className="hidden sm:inline">{level.category}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
