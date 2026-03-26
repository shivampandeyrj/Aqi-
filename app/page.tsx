'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wind, Loader2, AlertTriangle, TrendingUp, Heart, Clock, Calendar, Flame, Shield, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Java backend URL — set NEXT_PUBLIC_API_URL in Cloudflare Pages env vars
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const API_URL = rawApiUrl.replace(/\/$/, '');

interface CalculationResult {
  aqi: number;
  pm25: number;
  cigarettes: {
    perDay: number;
    perWeek: number;
    perMonth: number;
    perYear: number;
    packsPerMonth: number;
  };
  level: {
    category: string;
    color: string;
    healthImplications: string;
    precautions: string;
  };
  healthImpact: {
    minutesLostPerDay: number;
    daysLostPerYear: number;
    riskLevel: string;
    healthRisks: string[];
  };
  location?: string;
  placeInfo?: {
    name: string;
    summary: string;
    imageUrl: string;
    wikipediaUrl: string;
  };
}

// Full Java Backend Code for "Magic Behind the System"
const JAVA_BACKEND_CODE = `
/**
 * SECTION 1: CORE CALCULATION ENGINE (AqiCalculatorService.java)
 * Converts EPA AQI values into raw PM2.5 and maps them to Cigarette Equivalents.
 */
@Service
public class AqiCalculatorService {
    private static final double PM25_PER_CIGARETTE = 22.0;

    public CalculationResponse calculate(int aqi) {
        double pm25 = convertAqiToPm25(aqi);
        
        // Berkeley Earth Formula: 22 µg/m³ PM2.5 = 1 cigarette/day
        double cigsPerDay = pm25 / PM25_PER_CIGARETTE;
        
        // Impact Logic: 1 cigarette = 11 minutes life expectancy reduction
        double minsLostDay = cigsPerDay * 11.0;
        double daysLostYear = (minsLostDay * 365.0) / 1440.0;
        
        return new CalculationResponse(aqi, pm25, cigsPerDay, minsLostDay, daysLostYear);
    }
}

/**
 * SECTION 2: LIVE LOCATION ENGINE (LocationAqiService.java)
 * Integrates Open-Meteo for real-time AQI and BigDataCloud for Geocoding.
 */
@Service
public class LocationAqiService {
    public Map<String, Object> fetchAqi(double lat, double lng) {
        // 1. Call Open-Meteo Air Quality API
        // 2. Perform Reverse Geocoding to get human-readable city names
        String locationName = fetchLocationName(lat, lng);
        return Map.of("aqi", usAqi, "location", locationName);
    }
}

/**
 * SECTION 3: KNOWLEDGE ENRICHMENT (WikipediaService.java)
 * Fetches summaries and images to provide local context for the user.
 */
@Service
public class WikipediaService {
    public PlaceInfo fetchPlaceInfo(String city) {
        // Query Wikipedia REST API for the first part of the city name
        String searchTitle = city.split(",")[0].trim();
        return wikiApi.fetch("/page/summary/" + searchTitle);
    }
}

/**
 * SECTION 4: INTEGRATION CONTROLLER (LocationAqiController.java)
 * The REST API hub that orchestrates the entire data flow.
 */
@RestController
@RequestMapping("/api/aqi")
public class LocationAqiController {
    @GetMapping("/location")
    public ResponseEntity<?> analyze(double lat, double lng) {
        var baseRes = locationService.fetchAqi(lat, lng);
        var details = aqiService.calculate((int)baseRes.get("aqi"));
        var wiki = wikipediaService.fetchPlaceInfo((String)baseRes.get("location"));
        
        return ResponseEntity.ok(Map.of(
            "aqi", baseRes.get("aqi"),
            "location", baseRes.get("location"),
            "placeInfo", wiki,
            "details", details
        ));
    }
}
`;

// Animated Counter Component
function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toFixed(decimals)}</span>;
}

export default function Home() {
  const [aqi, setAqi] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMagic, setShowMagic] = useState(false);

  const calculateCigarettes = useCallback(async (aqiOverride?: number, placeData?: any) => {
    const aqiValue = aqiOverride ?? parseInt(aqi);
    if (isNaN(aqiValue) || aqiValue < 0 || aqiValue > 500) {
      setError('Please enter a valid AQI (0–500)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aqi: aqiValue }),
      });

      if (!response.ok) throw new Error('Calculation failed');
      const data = await response.json();

      // Normalize Java backend response shape to match frontend interface
      const normalized: CalculationResult = {
        aqi: data.aqi,
        pm25: data.details?.pm25 ?? data.pm25,
        cigarettes: {
          perDay: data.details?.cigarettes?.perDay ?? data.cigarettes?.perDay ?? 0,
          perWeek: (data.details?.cigarettes?.perDay ?? data.cigarettes?.perDay ?? 0) * 7.0,
          perMonth: (data.details?.cigarettes?.perDay ?? data.cigarettes?.perDay ?? 0) * 30.0,
          perYear: (data.details?.cigarettes?.perDay ?? data.cigarettes?.perDay ?? 0) * 365.0,
          packsPerMonth: ((data.details?.cigarettes?.perDay ?? data.cigarettes?.perDay ?? 0) * 30.0) / 20.0,
        },
        level: {
          category: data.details?.level?.category ?? data.level?.category ?? '',
          color: data.details?.level?.color ?? data.level?.color ?? '#666',
          healthImplications: data.details?.level?.healthImplications ?? data.level?.healthImplications ?? '',
          precautions: data.details?.level?.precautions ?? data.level?.precautions ?? '',
        },
        healthImpact: {
          minutesLostPerDay: data.details?.healthImpact?.minutesLostPerDay ?? data.healthImpact?.minutesLostPerDay ?? 0,
          daysLostPerYear: data.details?.healthImpact?.daysLostPerYear ?? data.healthImpact?.daysLostPerYear ?? 0,
          riskLevel: data.details?.healthImpact?.riskLevel ?? data.healthImpact?.riskLevel ?? 'Unknown',
          healthRisks: data.details?.healthImpact?.healthRisks ?? data.healthImpact?.healthRisks ?? [],
        },
        location: data.location,
        placeInfo: placeData ?? data.placeInfo,
      };
      setResult(normalized);
    } catch {
      setError('Failed to connect to the Java backend. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  }, [aqi]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setLocationLabel(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `${API_URL}/api/aqi/location?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) throw new Error('Location AQI fetch failed');
          const data = await res.json();

          const fetchedAqi = data.aqi?.toString() ?? '0';
          setAqi(fetchedAqi);
          setLocationLabel(`📍 ${data.location ?? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`} — AQI ${data.aqi}`);
          setLocationLoading(false);
          // Auto-calculate after location fetch
          await calculateCigarettes(data.aqi, data.placeInfo);
        } catch {
          setLocationError('Could not fetch AQI for your location. Enter manually.');
          setLocationLoading(false);
        }
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access and try again.'
            : 'Unable to determine your location.';
        setLocationError(msg);
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [calculateCigarettes]);

  const quickValues = [50, 100, 150, 200, 300, 400];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-radial from-teal-500/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Advanced Java-Powered Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              AQI to Cigarette
            </span>
            <span className="block mt-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Analyzer
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Unveiling the true impact of air pollution using high-precision calculations.
            Powered by a robust Spring Boot backend for real-time accuracy.
          </p>
        </header>

        {/* Technical Magic Section (Moved to Top) */}
        <div className="max-w-4xl mx-auto mb-16">
          <button
            onClick={() => setShowMagic(!showMagic)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-white/70 group-hover:text-white tracking-wide uppercase">
              {showMagic ? 'Hide Full System Magic' : 'Explore the Magic Behind the System'}
            </span>
          </button>

          {showMagic && (
            <div className="mt-8 animate-in fade-in zoom-in duration-500 space-y-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-emerald-400">
                    <TrendingUp className="w-4 h-4" /> Mathematical Methodology
                  </h3>
                  <ul className="space-y-4 text-sm text-white/50 leading-relaxed">
                    <li><strong className="text-white">AQI to PM2.5:</strong> Reverse interpolation using US EPA standard breakpoints.</li>
                    <li><strong className="text-white">Berkeley Earth Conversion:</strong> Every <code className="text-emerald-400 bg-white/5 px-1.5 rounded">22.0 µg/m³</code> = 1 cigarette reduction in health.</li>
                    <li><strong className="text-white">Lifespan Impact:</strong> Statistical reduction of <strong className="text-red-400">11 minutes</strong> per cigarette equivalent.</li>
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-cyan-400">
                    <Wind className="w-4 h-4" /> Technical Architecture
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Java Spring Boot 3', 'Next.js 14 / React', 'Rest Wikipedia API', 'Docker Hub'].map(tech => (
                      <div key={tech} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-center">
                        {tech}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Annotated Source Code */}
              <div className="bg-[#05050a] border border-white/10 rounded-3xl overflow-hidden shadow-3xl">
                <div className="bg-white/10 px-6 py-4 flex items-center justify-between border-b border-white/10">
                  <span className="text-xs font-mono text-white/40">Full_System_Code_Annotated.java</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                  </div>
                </div>
                <div className="p-8 overflow-y-auto max-h-[450px] custom-scrollbar">
                  <pre className="text-[12px] font-mono whitespace-pre text-cyan-300/90 leading-relaxed">
                    {JAVA_BACKEND_CODE}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* "Magic Behind" Tab Section - Moved to Top */}
        <div className="mb-12">
          <button
            onClick={() => setShowMagic(!showMagic)}
            className="mx-auto flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-white/70 hover:text-white mb-8"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            {showMagic ? 'Hide Technical Magic' : 'Explore the Magic Behind the System'}
          </button>

          {showMagic && (
            <div className="animate-in fade-in zoom-in duration-500 space-y-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Mathematical Methodology
                  </h3>
                  <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                    <p>
                      <strong className="text-white">1. AQI to PM2.5:</strong> We use the US EPA linear interpolation formula to convert index values back to raw Particulate Matter (µg/m³).
                    </p>
                    <p>
                      <strong className="text-white">2. Berkeley Earth Formula:</strong> Total PM2.5 exposure is divided by <code className="bg-white/10 px-1.5 rounded text-emerald-400">22.0</code>.
                      This factor equates the pollution to the damage of one cigarette.
                    </p>
                    <p>
                      <strong className="text-white">3. Lifespan Impact:</strong> Medical research indicates 1 cigarette reduces average life expectancy by <strong className="text-red-400">11 minutes</strong>.
                    </p>
                    <p>
                      <strong className="text-white">4. Temporal Scaling:</strong> Daily impact is scaled linearly across weeks, months, and years to provide a long-term perspective.
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Wind className="w-5 h-5 text-cyan-400" />
                    Technical Stack
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-xs text-white/30 mb-1">Backend</p>
                      <p className="text-sm font-bold">Java Spring Boot 3</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-xs text-white/30 mb-1">Frontend</p>
                      <p className="text-sm font-bold">Next.js 14 / React</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-xs text-white/30 mb-1">APIs</p>
                      <p className="text-sm font-bold">Open-Meteo / Wiki</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-xs text-white/30 mb-1">Deployment</p>
                      <p className="text-sm font-bold">Render (Docker)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Java Code View */}
              <div className="bg-[#05050a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-white/10 px-6 py-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="text-xs font-mono text-white/40 ml-4">FullSystemCode.java (Annotated)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-tighter">System Transparency</span>
                </div>
                <div className="p-8 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <pre className="text-[13px] font-mono whitespace-pre text-cyan-300 leading-relaxed">
                    {JAVA_BACKEND_CODE}
                  </pre>
                </div>
              </div>

              {/* Mermaid Graph Simulation */}
              <div className="text-center py-4">
                <p className="text-[10px] text-white/20 uppercase tracking-widest mb-6 italic">Architecture Visualization</p>
                <div className="flex flex-col items-center gap-4">
                  <div className="px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 font-mono text-xs">User Browser (Next.js)</div>
                  <div className="w-px h-8 bg-gradient-to-b from-cyan-500/30 to-emerald-500/30" />
                  <div className="px-6 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs font-bold">Java REST API (Spring Boot)</div>
                  <div className="flex gap-8 mt-4">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-8 bg-emerald-500/20" />
                      <div className="px-4 py-2 rounded-lg border border-white/10 text-[10px]">Open-Meteo</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-8 bg-emerald-500/20" />
                      <div className="px-4 py-2 rounded-lg border border-white/10 text-[10px]">BigDataCloud</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-px h-8 bg-emerald-500/20" />
                      <div className="px-4 py-2 rounded-lg border border-white/10 text-[10px]">Wikipedia</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calculator Card */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />

            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">

              {/* Auto-detect Location Button */}
              <div className="mb-6">
                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locating & Fetching City Info...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Precision Fetch: AQI & City Data
                    </>
                  )}
                </button>

                {locationLabel && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-400/80 text-xs bg-emerald-500/10 rounded-xl px-4 py-2.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    {locationLabel}
                  </div>
                )}

                {locationError && (
                  <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 rounded-xl px-4 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {locationError}
                  </div>
                )}

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-white/30 bg-[#0a0a0f]">or manual analysis</span>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium text-white/60 mb-4">
                Air Quality Index (AQI)
              </label>

              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="0 - 500"
                    value={aqi}
                    onChange={(e) => setAqi(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateCigarettes()}
                    className="h-16 text-xl bg-white/5 border-white/10 rounded-2xl pl-6 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    min="0"
                    max="500"
                  />
                </div>

                <Button
                  onClick={() => calculateCigarettes()}
                  disabled={loading}
                  className="h-16 px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Analyze'}
                </Button>
              </div>

              {/* Quick Select */}
              <div className="mt-6 flex flex-wrap gap-2">
                {quickValues.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAqi(val.toString())}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 hover:border-white/10 transition-all duration-200"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-6 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-4">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Wikipedia City Info Section */}
            {result.placeInfo && (
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                {result.placeInfo.imageUrl && (
                  <div className="w-full md:w-1/3 h-64 md:h-auto overflow-hidden">
                    <img
                      src={result.placeInfo.imageUrl}
                      alt={result.placeInfo.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                )}
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-2xl font-bold text-white">{result.placeInfo.name}</h2>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {result.placeInfo.summary}
                  </p>
                  <a
                    href={result.placeInfo.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider"
                  >
                    Read more on Wikipedia →
                  </a>
                </div>
              </div>
            )}

            {/* Main Result Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-40" />

              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Circular Gauge */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <svg viewBox="0 0 200 200" className="w-72 h-72 md:w-80 md:h-80">
                        <defs>
                          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={result.level.color} />
                            <stop offset="100%" stopColor={result.level.color} stopOpacity="0.5" />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <circle
                          cx="100" cy="100" r="85"
                          fill="none"
                          stroke="url(#gaugeGrad)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(result.aqi / 500) * 534} 534`}
                          transform="rotate(-90 100 100)"
                          filter="url(#glow)"
                          className="transition-all duration-1000"
                        />

                        <text x="100" y="85" textAnchor="middle" className="fill-white/40 text-xs font-medium">
                          EQUIVALENT TO
                        </text>
                        <text x="100" y="115" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: '36px' }}>
                          <AnimatedNumber value={result.cigarettes.perDay} decimals={1} />
                        </text>
                        <text x="100" y="140" textAnchor="middle" className="fill-white/60 text-sm">
                          cigarettes/day
                        </text>
                      </svg>

                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-sm shadow-lg"
                        style={{ backgroundColor: result.level.color, color: '#fff' }}
                      >
                        AQI {result.aqi} — {result.level.category}
                      </div>
                    </div>
                  </div>

                  {/* Cigarette Visualization */}
                  <div>
                    <h3 className="text-lg font-semibold text-white/80 mb-6 text-center">
                      Impact Visualization
                    </h3>

                    <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto">
                      {Array.from({ length: Math.min(Math.ceil(result.cigarettes.perDay), 15) }).map((_, i) => (
                        <div
                          key={i}
                          className="group relative"
                          style={{
                            animation: `fadeSlideUp 0.4s ease-out forwards`,
                            animationDelay: `${i * 60}ms`,
                            opacity: 0
                          }}
                        >
                          <div className="relative h-20 w-6 mx-auto transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/30 rounded-full blur-sm" />
                            <div className="absolute bottom-0 w-full h-6 rounded-b-sm overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-b from-[#E8B87D] via-[#D4A56A] to-[#C4956A] shadow-inner" />
                            </div>
                            <div className="absolute bottom-6 w-full h-10 bg-gradient-to-r from-[#FAFAFA] via-white to-[#F5F5F5] shadow-sm" />
                            <div className="absolute top-0 w-full h-4 rounded-t-sm overflow-hidden">
                              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-[#9E9E9E] to-[#757575]" />
                              <div className="absolute bottom-0 w-full h-2 bg-gradient-to-t from-[#FF6B35] via-[#FF8C42] to-[#666]">
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-transparent" style={{ animation: 'pulse 1s ease-in-out infinite' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.cigarettes.perDay > 15 && (
                      <p className="text-center text-red-400 text-sm mt-4 font-medium">
                        + {Math.ceil(result.cigarettes.perDay - 15)} more cigarettes
                      </p>
                    )}

                    {/* Risk Level Badge */}
                    <div className="mt-6 text-center">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border"
                        style={{
                          borderColor: result.level.color + '60',
                          color: result.level.color,
                          backgroundColor: result.level.color + '15',
                        }}>
                        <Flame className="w-3 h-3" />
                        Status: {result.healthImpact.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Wind, label: 'Particulate Matter (PM2.5)', value: `${result.pm25}`, unit: 'µg/m³', color: 'emerald' },
                { icon: TrendingUp, label: 'Weekly Exposure', value: result.cigarettes.perWeek.toFixed(1), unit: 'cigs', color: 'cyan' },
                { icon: Clock, label: 'Life Lost/Day', value: result.healthImpact.minutesLostPerDay.toFixed(0), unit: 'min', color: 'amber' },
                { icon: Calendar, label: 'Monthly Pack Equiv.', value: result.cigarettes.packsPerMonth.toFixed(1), unit: 'packs', color: 'rose' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:bg-white/10 transition-colors group"
                >
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-3 group-hover:scale-110 transition-transform`} />
                  <p className="text-white/40 text-xs mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">
                    <AnimatedNumber value={parseFloat(stat.value)} decimals={stat.value.includes('.') ? 1 : 0} />
                    <span className="text-sm font-normal text-white/40 ml-1">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Health Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl hover:bg-white/[0.08] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white">Health Implications</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{result.level.healthImplications}</p>
              </div>

              <div className="bg-emerald-500/5 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6 shadow-xl hover:bg-emerald-500/10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Recommended Precautions</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed font-medium">{result.level.precautions}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.01] backdrop-blur-sm rounded-3xl border border-white/10 p-10">
              <div className="grid md:grid-cols-2 gap-12 text-center items-center">
                <div>
                  <p className="text-5xl font-bold text-white mb-2">
                    <AnimatedNumber value={result.cigarettes.perYear} decimals={0} />
                  </p>
                  <p className="text-white/40 text-sm font-medium tracking-wide uppercase">Cigarettes per Year</p>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-red-500/5 blur-xl rounded-full" />
                  <p className="text-5xl font-bold text-red-500 mb-2">
                    <AnimatedNumber value={result.healthImpact.daysLostPerYear} decimals={1} />
                  </p>
                  <p className="text-white/40 text-sm font-medium tracking-wide uppercase">Days of Life Lost/Year</p>
                  <p className="text-[10px] text-red-400/50 mt-1">*Based on 11 min/cig formula</p>
                </div>
              </div>
            </div>


            {/* Footer Methodology */}
            <div className="text-center py-8">
              <p className="text-white/30 text-xs max-w-2xl mx-auto">
                Calculation based on Berkeley Earth Research: 22 µg/m³ PM2.5 = 1 cigarette equivalent.
                AQI to PM2.5 conversion follows US EPA standards. Health impact estimates based on peer-reviewed medical research.
                Location data enriched via Open-Meteo and Wikipedia Rest API.
              </p>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}} />
    </main>
  );
}
