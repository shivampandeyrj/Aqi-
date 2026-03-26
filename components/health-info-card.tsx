'use client';

import { AlertTriangle, Info, Shield, Activity } from 'lucide-react';
import { type AQILevelInfo } from '@/lib/aqi-types';

interface HealthInfoCardProps {
  level: AQILevelInfo;
  aqi: number;
}

export function HealthInfoCard({ level, aqi }: HealthInfoCardProps) {
  const getIcon = () => {
    if (aqi <= 50) return Shield;
    if (aqi <= 100) return Info;
    if (aqi <= 150) return Activity;
    return AlertTriangle;
  };

  const Icon = getIcon();

  return (
    <div 
      className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up"
      style={{ 
        animationDelay: '400ms',
        borderColor: `${level.color}30`
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${level.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: level.color }} />
        </div>
        <div>
          <h3 
            className="text-xl font-bold"
            style={{ color: level.color }}
          >
            {level.category}
          </h3>
          <p className="text-sm text-muted-foreground">{level.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-secondary/50">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Implications
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {level.healthImplications}
          </p>
        </div>

        {level.cautionaryStatement !== 'None' && (
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${level.color}10` }}
          >
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: level.color }} />
              Precautionary Measures
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {level.cautionaryStatement}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
