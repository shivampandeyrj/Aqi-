'use client';

import { useState, useCallback } from 'react';
import { 
  Wind, 
  Cigarette, 
  Calendar, 
  CalendarDays, 
  CalendarClock,
  Clock,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CigaretteVisual } from './cigarette-visual';
import { AQIScale } from './aqi-scale';
import { StatsCard } from './stats-card';
import { HealthInfoCard } from './health-info-card';
import { SmokeParticles } from './smoke-particles';
import { AnimatedCounter } from './animated-counter';
import { type CalculationResult } from '@/lib/aqi-types';

export function AQICalculator() {
  console.log('[v0] AQICalculator component rendering');
  const [aqi, setAqi] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCigarettes = useCallback(async () => {
    const aqiValue = parseInt(aqi);
    
    if (isNaN(aqiValue) || aqiValue < 0 || aqiValue > 500) {
      setError('Please enter a valid AQI value between 0 and 500');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aqi: aqiValue })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate');
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setError('Failed to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [aqi]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateCigarettes();
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background smoke effect */}
      <SmokeParticles intensity={result ? result.cigarettes.perDay : 0} />
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <header className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Air Quality Monitor</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
            AQI to Cigarette
            <span className="block text-primary">Calculator</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover how air pollution affects your health by converting Air Quality Index 
            to equivalent cigarettes smoked per day
          </p>
        </header>

        {/* Calculator Input */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="glass-card rounded-2xl p-6 md:p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Enter Current AQI Value
            </label>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="Enter AQI (0-500)"
                  value={aqi}
                  onChange={(e) => setAqi(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="glass-input h-14 text-lg pl-12 pr-4 rounded-xl border-border/50 focus:border-primary focus:ring-primary"
                  min={0}
                  max={500}
                />
                <Wind className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              
              <Button
                onClick={calculateCigarettes}
                disabled={loading || !aqi}
                className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 animate-pulse-glow"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Calculate'
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Quick select buttons */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-3">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 150, 200, 300, 400].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAqi(value.toString())}
                    className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-8">
            {/* Main Result */}
            <div className="max-w-4xl mx-auto">
              <div 
                className="glass-card rounded-3xl p-8 md:p-12 text-center animate-slide-up"
                style={{ 
                  animationDelay: '200ms',
                  borderColor: `${result.level.color}30`
                }}
              >
                <p className="text-muted-foreground mb-2">Breathing this air is equivalent to smoking</p>
                
                <div className="flex items-center justify-center gap-4 my-6">
                  <Cigarette className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                  <span className="text-6xl md:text-8xl font-bold text-foreground animate-count">
                    <AnimatedCounter 
                      value={result.cigarettes.perDay} 
                      decimals={1}
                      duration={2000}
                    />
                  </span>
                </div>
                
                <p className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                  Cigarettes Per Day
                </p>

                {/* Cigarette Visual */}
                <CigaretteVisual count={result.cigarettes.perDay} maxDisplay={12} />

                {/* PM2.5 Info */}
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
                  <span className="text-sm text-muted-foreground">
                    PM2.5 Concentration: <span className="font-semibold text-foreground">{result.pm25} µg/m³</span>
                  </span>
                </div>
              </div>
            </div>

            {/* AQI Scale */}
            <div className="max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <AQIScale currentAqi={result.aqi} levels={result.allLevels} />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">Extended Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatsCard 
                  icon={Calendar} 
                  label="Per Day" 
                  value={result.cigarettes.perDay}
                  suffix=" cigs"
                  delay={100}
                />
                <StatsCard 
                  icon={CalendarDays} 
                  label="Per Week" 
                  value={result.cigarettes.perWeek}
                  suffix=" cigs"
                  delay={200}
                />
                <StatsCard 
                  icon={CalendarClock} 
                  label="Per Month" 
                  value={result.cigarettes.perMonth}
                  suffix=" cigs"
                  decimals={0}
                  delay={300}
                />
                <StatsCard 
                  icon={Package} 
                  label="Packs/Month" 
                  value={result.cigarettes.packsPerMonth}
                  suffix=" packs"
                  delay={400}
                />
                <StatsCard 
                  icon={Clock} 
                  label="Per Year" 
                  value={result.cigarettes.perYear}
                  suffix=" cigs"
                  decimals={0}
                  delay={500}
                />
              </div>
            </div>

            {/* Health Impact */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">Health Impact</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-destructive/20">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-foreground">Life Lost Per Year</h3>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedCounter 
                      value={result.healthImpact.yearsOfLifeLostPerYear * 365 * 24} 
                      decimals={0}
                      suffix=" hours"
                      duration={1500}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on estimated 11 minutes lost per cigarette
                  </p>
                </div>

                <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-warning/20">
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <h3 className="font-semibold text-foreground">Daily Impact</h3>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedCounter 
                      value={result.healthImpact.minutesLostPerDay} 
                      decimals={0}
                      suffix=" minutes"
                      duration={1500}
                    />
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Of life expectancy potentially lost each day
                  </p>
                </div>
              </div>
            </div>

            {/* Health Information Card */}
            <div className="max-w-4xl mx-auto">
              <HealthInfoCard level={result.level} aqi={result.aqi} />
            </div>

            {/* Disclaimer */}
            <div className="max-w-3xl mx-auto">
              <div className="glass-card rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This calculation is based on Berkeley Earth research comparing PM2.5 exposure to cigarette smoking. 
                  22 µg/m³ of PM2.5 ≈ 1 cigarette per day. Results are approximations for awareness purposes only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '600ms' }}>
          <p>Data based on scientific research by Berkeley Earth</p>
          <p className="mt-2">Built for health awareness</p>
        </footer>
      </div>
    </div>
  );
}
