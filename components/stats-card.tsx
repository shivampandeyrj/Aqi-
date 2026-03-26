'use client';

import { AnimatedCounter } from './animated-counter';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delay?: number;
}

export function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '', 
  decimals = 1,
  delay = 0
}: StatsCardProps) {
  return (
    <div 
      className="glass-card rounded-xl p-4 hover:bg-foreground/10 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold text-foreground">
            <AnimatedCounter 
              value={value} 
              decimals={decimals}
              suffix={suffix}
              duration={1200}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
