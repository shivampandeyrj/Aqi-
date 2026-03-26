'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export function SmokeParticles({ intensity = 1 }: { intensity?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const count = Math.min(Math.floor(intensity * 8), 20);
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        size: 20 + Math.random() * 40
      });
    }
    
    setParticles(newParticles);
  }, [intensity]);

  if (intensity < 0.5) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${particle.x}%`,
            bottom: '-20px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`,
            animation: `smoke-rise ${particle.duration}s ease-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
}
