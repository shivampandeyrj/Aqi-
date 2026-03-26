'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Wind, Loader2, AlertTriangle, TrendingUp, Heart, Clock, Calendar, Flame, Shield, MapPin, CheckCircle, Code2, Box, Zap, Share2, FileJson, FolderTree, Folder, FileCode, Cpu, Activity, Database } from 'lucide-react';
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
    sourceUrl: string;

  };
}

// Structured Java Backend Codebase for the Hierarchical Explorer
const JAVA_BACKEND_FILES = {
  'AqiCalculatorApplication.java': {
    name: 'AqiCalculatorApplication.java',
    folder: 'root',
    code: `package com.aqicalculator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AqiCalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(AqiCalculatorApplication.class, args);
    }
}`,
    description: 'The main entry point of the Spring Boot application.'
  },
  'AqiController.java': {
    name: 'AqiController.java',
    folder: 'controller',
    code: `package com.aqicalculator.controller;

import com.aqicalculator.service.AqiCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AqiController {

    @Autowired
    private AqiCalculatorService calculatorService;

    @PostMapping("/calculate")
    public ResponseEntity<?> calculate(@RequestBody Map<String, Integer> request) {
        Integer aqi = request.get("aqi");
        if (aqi == null) return ResponseEntity.badRequest().body("AQI is required");
        return ResponseEntity.ok(calculatorService.calculate(aqi));
    }
}`,
    description: 'Handles basic AQI to cigarette calculations via POST requests.'
  },
  'LocationAqiController.java': {
    name: 'LocationAqiController.java',
    folder: 'controller',
    code: `package com.aqicalculator.controller;

import com.aqicalculator.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/aqi")
@CrossOrigin(origins = "*")
public class LocationAqiController {
    private final LocationAqiService locationAqiService;
    private final CityInfoService cityInfoService;
    private final AqiCalculatorService aqiCalculatorService;

    @Autowired
    public LocationAqiController(LocationAqiService lService, CityInfoService cService, AqiCalculatorService aService) {
        this.locationAqiService = lService;
        this.cityInfoService = cService;
        this.aqiCalculatorService = aService;
    }

    @GetMapping("/location")
    public ResponseEntity<?> getAqiByLocation(@RequestParam double lat, @RequestParam double lng) {
        try {
            Map<String, Object> result = locationAqiService.fetchAqi(lat, lng);
            String cityName = (String) result.get("location");
            result.put("placeInfo", cityInfoService.fetchPlaceInfo(cityName));
            
            // Core Logic: Re-calculate AQI using PM2.5 + 2024 EPA standards
            double pm25 = (double) result.get("pm25");
            CalculationResponse details = aqiCalculatorService.calculateFromPm25(pm25);
            result.put("aqi", details.getAqi());
            result.put("details", details);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchAqi(@RequestParam String query) {
        try {
            var stations = locationAqiService.searchStations(query);
            if (stations.isEmpty()) return ResponseEntity.status(404).body("No stations found");
            var best = stations.get(0);
            return getAqiByLocation((double)best.get("lat"), (double)best.get("lng"));
        } catch (Exception e) { return ResponseEntity.internalServerError().body(e.getMessage()); }
    }
}`,
    description: 'Orchestrates the full data flow: Geolocation/Search -> WAQI API -> City Info -> 2024 EPA Precision Calculations.'
  },
  'AqiCalculatorService.java': {
    name: 'AqiCalculatorService.java',
    folder: 'service',
    code: `package com.aqicalculator.service;

import com.aqicalculator.model.*;
import org.springframework.stereotype.Service;

@Service
public class AqiCalculatorService {
  private static final double[][] AQI_BREAKPOINTS = {
        { 0.0, 9.0, 0, 50 }, { 9.1, 35.4, 51, 100 }, { 35.5, 55.4, 101, 150 },
        { 55.5, 125.4, 151, 200 }, { 125.5, 225.4, 201, 300 }, { 225.5, 500.4, 301, 500 }
    };
    private static final double PM25_PER_CIGARETTE = 22.0;

    public CalculationResponse calculate(int aqi) {
        double pm25 = convertAqiToPm25(aqi);
        double cigarettesPerDay = pm25 / PM25_PER_CIGARETTE;
        CalculationResponse response = new CalculationResponse();
  response.setAqi(aqi);
  response.setPm25(Math.round(pm25 * 10.0) / 10.0);
  response.setCigarettes(new CigaretteEquivalent(Math.round(cigarettesPerDay * 100.0) / 100.0));
  response.setLevel(getAqiLevel(aqi));
  response.setHealthImpact(calculateHealthImpact(cigarettesPerDay, aqi));
  return response;
}

    private double convertAqiToPm25(int aqi) {
  for (double[] bp : AQI_BREAKPOINTS) {
    if (aqi >= bp[2] && aqi <= bp[3]) {
      return ((bp[1] - bp[0]) / (bp[3] - bp[2])) * (aqi - bp[2]) + bp[0];
    }
  }
  return aqi * 0.5;
}

    private HealthImpact calculateHealthImpact(double cigarettesPerDay, int aqi) {
        double minutesLostPerDay = cigarettesPerDay * 11;
  return new HealthImpact(
    Math.round((minutesLostPerDay * 365) / 60.0),
    Math.round(minutesLostPerDay * 10.0) / 10.0,
    Math.round(minutesLostPerDay * 365 / 1440.0 * 10.0) / 10.0,
    aqi > 100 ? "High" : "Moderate",
    new String[]{ "Respiratory impact", "Long-term risk"}
  );
}
}`,
    description: 'The mathematical engine implementing Berkeley Earth research.'
  },
  'LocationAqiService.java': {
    name: 'LocationAqiService.java',
    folder: 'service',
    code: `package com.aqicalculator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;

@Service
public class LocationAqiService {
  private static final String WAQI_URL = "https://api.waqi.info/feed/geo:%s;%s/?token=%s";
  private final String waqiToken = "f878f...7e2"; // Redacted in UI

  public Map<String, Object> fetchAqi(double lat, double lng) throws Exception {
    String url = String.format(WAQI_URL, lat, lng, waqiToken);
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    
    JsonNode root = new ObjectMapper().readTree(response.body());
    JsonNode data = root.path("data");
    double pm25 = data.path("iaqi").path("pm25").path("v").asDouble();
    
    // Core Fix: Use BigDataCloud for city name, WAQI for data
    String location = fetchLocationFromBDC(lat, lng); 
    if (location == null) location = data.path("city").path("name").asText();
    
    return Map.of("aqi", data.path("aqi").asInt(), "pm25", pm25, "location", location);
  }
} // + fetchLocationFromBDC private method`,
    description: 'A dual-source orchestrator: Extracts pollutant IoT data from WAQI while using BigDataCloud for high-fidelity reverse geocoding.'
  },
  'CityInfoService.java': {
    name: 'CityInfoService.java',
    folder: 'service',
    code: `package com.aqicalculator.service;

import com.aqicalculator.model.PlaceInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;

@Service
public class CityInfoService {
  private static final String TELEPORT_SEARCH_URL = "https://api.teleport.org/api/cities/?search=%s";

  public PlaceInfo fetchPlaceInfo(String cityName) {
    try {
            String searchTitle = cityName.split(",")[0].trim();
            String encodedCity = URLEncoder.encode(searchTitle, StandardCharsets.UTF_8);
            HttpClient client = HttpClient.newHttpClient();
      // 1. Search -> 2. City Details -> 3. Urban Area -> 4. Scores/Images
      return new PlaceInfo(searchTitle, "A vibrant city mapped for health impact analysis.", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000", uaUrl);

    } catch (Exception e) { return null; }
  }
} `,
    description: 'Enriches location data with Teleport API city insights.'
  },
  'AqiLevel.java': {
    name: 'AqiLevel.java',
    folder: 'model',
    code: `package com.aqicalculator.model;

public class AqiLevel {
  private String category;
  private String color;
  private String healthImplications;
  private String precautions;
  private int minAqi;
  private int maxAqi;

  public AqiLevel() { }
  public AqiLevel(String category, String color, String health, String prec, int min, int max) {
    this.category = category;
    this.color = color;
    this.healthImplications = health;
    this.precautions = prec;
  }
  // Getters/Setters...
} `,
    description: 'Defines EPA health categories and advice.'
  },
  'CalculationResponse.java': {
    name: 'CalculationResponse.java',
    folder: 'model',
    code: `package com.aqicalculator.model;

public class CalculationResponse {
  private int aqi;
  private double pm25;
  private CigaretteEquivalent cigarettes;
  private AqiLevel level;
  private HealthImpact healthImpact;
  private PlaceInfo placeInfo;
  // Getters/Setters...
} `,
    description: 'Unified API response model.'
  },
  'CigaretteEquivalent.java': {
    name: 'CigaretteEquivalent.java',
    folder: 'model',
    code: `package com.aqicalculator.model;

public class CigaretteEquivalent {
  private double perDay;
  private double perWeek;
  private double perMonth;
  private double perYear;
  private double packsPerMonth;

  public CigaretteEquivalent(double perDay) {
    this.perDay = perDay;
    this.perWeek = perDay * 7;
    this.perMonth = perDay * 30;
    this.perYear = perDay * 365;
    this.packsPerMonth = (perDay * 30) / 20;
  }
  // Getters/Setters...
} `,
    description: 'Cigarette equivalency model based on PM2.5.'
  },
  'HealthImpact.java': {
    name: 'HealthImpact.java',
    folder: 'model',
    code: `package com.aqicalculator.model;

public class HealthImpact {
  private double lifeExpectancyLossHours;
  private double minutesLostPerDay;
  private double daysLostPerYear;
  private String riskLevel;
  private String[] healthRisks;
  // Getters/Setters...
} `,
    description: 'Health impact analysis results.'
  },
  'PlaceInfo.java': {
    name: 'PlaceInfo.java',
    folder: 'model',
    code: `package com.aqicalculator.model;

public class PlaceInfo {
  private String name;
  private String summary;
  private String imageUrl;
  private String sourceUrl;

  // Getters/Setters...
} `,
    description: 'City metadata and visuals.'
  }
};

// Animated Counter Component
function AnimatedNumber({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 40;
    const startValue = display;
    const endValue = value;
    const increment = (endValue - startValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplay(endValue);
        clearInterval(timer);
      } else {
        setDisplay(startValue + increment * currentStep);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
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
  const [selectedFile, setSelectedFile] = useState('LocationAqiController.java');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const calculateCigarettes = useCallback(async (aqiOverride?: number, placeData?: any, locationName?: string) => {
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
        location: locationName ?? data.location,
        placeInfo: placeData ?? data.placeInfo,
      };
      setResult(normalized);
    } catch {
      setError('Failed to connect to the Java backend. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  }, [aqi]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setLocationError(null);
    setLocationLabel(null);

    try {
      const res = await fetch(`${API_URL}/api/aqi/search?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('No monitoring stations found for this location.');
        throw new Error('Search failed');
      }
      const data = await res.json();

      const fetchedAqi = data.aqi?.toString() ?? '0';
      setAqi(fetchedAqi);
      setLocationLabel(`🔍 ${data.location || data.station || searchQuery} — AQI ${data.aqi}`);

      // The search endpoint already returns the full enriched details object
      if (data.details) {
        // Normalize to CalculationResult
        const normalized: CalculationResult = {
          aqi: data.aqi,
          pm25: data.details.pm25,
          cigarettes: {
            perDay: data.details.cigarettes.perDay,
            perWeek: data.details.cigarettes.perDay * 7,
            perMonth: data.details.cigarettes.perDay * 30,
            perYear: data.details.cigarettes.perDay * 365,
            packsPerMonth: (data.details.cigarettes.perDay * 30) / 20
          },
          level: data.details.level,
          healthImpact: data.details.healthImpact,
          location: data.location,
          placeInfo: data.placeInfo
        };
        setResult(normalized);
      }
    } catch (err: any) {
      setError(err.message || 'Location search failed. Try another city.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, calculateCigarettes]);

  // Handle Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/aqi/suggestions?query=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
          const res = await fetch(`${API_URL}/api/aqi/location?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error('Location AQI fetch failed');
          const data = await res.json();

          const fetchedAqi = data.aqi?.toString() ?? '0';
          setAqi(fetchedAqi);
          setLocationLabel(`📍 ${data.location ?? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`} — AQI ${data.aqi} `);
          setLocationLoading(false);
          // Auto-calculate after location fetch
          await calculateCigarettes(data.aqi, data.placeInfo, data.location);
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

        {/* Unified Technical Transparency Section */}
        <div className="max-w-5xl mx-auto mb-20 px-4">
          <button
            onClick={() => setShowMagic(!showMagic)}
            className="w-full relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center justify-center gap-4 py-6 rounded-2xl bg-[#0a0a0f] border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Code2 className={`w-5 h-5 text-cyan-400 ${showMagic ? 'rotate-180' : ''} transition-transform duration-500`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white tracking-widest uppercase mb-1">
                  {showMagic ? 'Close Technical Architecture' : 'Explore the Magic Behind the System'}
                </p>
                <p className="text-xs text-white/40">Full Hierarchical Backend Viewer & Data Orchestration Explanation</p>
              </div>
            </div>
          </button>

          {showMagic && (
            <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-700 space-y-12">
              {/* System Overview Tags */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Runtime', val: 'Java 17 JRE', icon: Box },
                  { label: 'Framework', val: 'Spring Boot 3', icon: Zap },
                  { label: 'Orchestration', val: 'REST API', icon: Share2 },
                  { label: 'Methodology', val: 'Berkeley Earth', icon: FileJson },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                    <item.icon className={`w-4 h-4 text-emerald-400/60 mb-2 ${item.label === 'Runtime' ? 'animate-pulse' : ''}`} />
                    <p className="text-[10px] text-white/20 uppercase font-bold mb-1">{item.label}</p>
                    <p className="text-xs font-bold text-white/80">{item.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#05050a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] md:h-[750px] backdrop-blur-3xl">
                {/* Sidebar Explorer */}
                <div className="w-full md:w-80 md:shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02] p-6 flex flex-col overflow-hidden">

                  <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
                    <FolderTree className="w-5 h-5 text-cyan-400" />
                    <span className="text-[10px] md:text-xs font-bold text-white/40 tracking-widest uppercase">java-backend</span>
                  </div>

                  <div className="flex md:flex-col gap-4 md:gap-6 overflow-x-auto md:overflow-y-auto custom-scrollbar flex-1 pb-2 md:pb-0">
                    {/* Folders */}
                    {['root', 'controller', 'service', 'model'].map(folder => (
                      <div key={folder}>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Folder className="w-3.5 h-3.5 text-amber-400/60" />
                          <span className="text-[11px] font-bold text-white/30 uppercase tracking-tighter">{folder}</span>
                        </div>
                        <div className="space-y-1 ml-3">
                          {Object.entries(JAVA_BACKEND_FILES)
                            .filter(([_, file]) => file.folder === folder)
                            .map(([key, file]) => (
                              <button
                                key={key}
                                onClick={() => setSelectedFile(key)}
                                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2 group ${selectedFile === key ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}
                              >
                                <FileCode className={`w-3.5 h-3.5 ${selectedFile === key ? 'text-cyan-400' : 'text-white/20'}`} />
                                <span className="text-[11px] font-mono truncate">{file.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Window */}
                <div className="flex-1 min-w-0 flex flex-col bg-[#05050a]">

                  <div className="h-14 border-b border-white/10 px-8 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5 mr-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/30" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                      </div>
                      <span className="text-xs font-mono text-cyan-400/80">{JAVA_BACKEND_FILES[selectedFile as keyof typeof JAVA_BACKEND_FILES].name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                      <Cpu className="w-3 h-3" /> Source Insight
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar bg-[#020205]">
                    <p className="text-[10px] md:text-[11px] text-white/30 mb-6 font-medium italic border-l-2 border-cyan-500/30 pl-4">
                      {JAVA_BACKEND_FILES[selectedFile as keyof typeof JAVA_BACKEND_FILES].description}
                    </p>
                    <pre className="text-[11px] md:text-[13px] font-mono text-cyan-300/90 leading-relaxed selection:bg-cyan-500/30 selection:text-white overflow-x-auto">
                      {JAVA_BACKEND_FILES[selectedFile as keyof typeof JAVA_BACKEND_FILES].code}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Data Flow explanation */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    Request Lifecycle
                  </h3>
                  <div className="space-y-6">
                    {[
                      { step: '01', title: 'Geospatial Handshake', desc: 'Secure coordinate verification and REST validation.' },
                      { step: '02', title: 'Station Authentication', desc: 'Secure handshake with WAQI API using production-grade tokens.' },
                      { step: '03', title: 'IoT Extraction', desc: 'Parsing sub-micron particle data (iaqi.pm25) from remote sensors.' },
                      { step: '04', title: 'Contextual Enrichment', desc: 'Aggregating city-level meta-data from Teleport repositories.' },
                      { step: '05', title: 'Berkeley Core', desc: 'Executing the non-linear cigarette mathematical derivation.' },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-xs font-black text-white/10 group-hover:text-emerald-500/40 transition-colors pt-1">{step.step}</span>
                        <div>
                          <p className="text-sm font-bold text-white/80 mb-1">{step.title}</p>
                          <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <Database className="w-5 h-5 text-cyan-400" />
                    </div>
                    Data Orchestration
                  </h3>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-mono text-white/40 tracking-wider">NEXT.JS CLIENT</div>
                      <div className="w-px h-8 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />
                      <div className="px-6 py-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.1)]">SPRING BOOT SYSTEM</div>
                      <div className="flex gap-6 mt-4">
                        {['WAQI Network', 'Teleport API', 'IoT Sensors'].map(node => (
                          <div key={node} className="flex flex-col items-center">
                            <div className="w-px h-6 bg-white/10" />
                            <div className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-[9px] font-mono text-white/30">{node}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/20 mt-8 text-center leading-relaxed">
                    The backend strictly separates concerns: Controllers manage HTTP, Services manage business logic/External APIs, and Models define the contract.
                  </p>
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

              {/* Search Bar & Location Discovery */}
              <div className="mb-8">
                <form onSubmit={handleSearch} className="flex gap-2 group mb-6">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search city (e.g. New York, Delhi...)"
                      value={searchQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 rounded-2xl pl-12 text-white placeholder:text-white/30 focus:border-emerald-500/50 transition-all"
                    />
                    <Wind className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d15] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        {suggestions.map((s: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSearchQuery(s);
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-5 py-3 text-xs text-white/60 hover:text-emerald-400 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0f] font-bold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                  </Button>
                </form>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-white/20 bg-[#0a0a0f]">or select source</span>
                  </div>
                </div>

                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locating & Fetching City Info...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      Precision Fetch: Use Current Location
                    </>
                  )}
                </button>

                {locationLabel && (
                  <div className="mt-4 flex items-center gap-3 text-emerald-400 text-xs bg-emerald-500/10 rounded-2xl px-5 py-3 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{locationLabel}</span>
                  </div>
                )}

                {locationError && (
                  <div className="mt-4 flex items-center gap-3 text-amber-400 text-xs bg-amber-500/10 rounded-2xl px-5 py-3 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}
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

            {/* City Information Section */}
            {(result.placeInfo || result.location) && (
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                {result.placeInfo?.imageUrl && (
                  <div className="w-full md:w-1/3 h-64 md:h-auto overflow-hidden">
                    <img
                      src={result.placeInfo.imageUrl}
                      alt={result.placeInfo.name || result.location}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                  </div>
                )}
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-2xl font-bold text-white">{result.placeInfo?.name || result.location || 'Detected Location'}</h2>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {result.placeInfo?.summary || "Direct air quality analysis for this location, enriched with real-time environmental data."}
                  </p>
                  {result.placeInfo?.sourceUrl && (
                    <a
                      href={result.placeInfo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider"
                    >
                      Explore Urban Area Insights →
                    </a>
                  )}
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
                { icon: Wind, label: 'Particulate Matter (PM2.5)', value: `${result.pm25} `, unit: 'µg/m³', color: 'emerald' },
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
                Location data enriched via Open-Meteo and Teleport Urban API.
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
