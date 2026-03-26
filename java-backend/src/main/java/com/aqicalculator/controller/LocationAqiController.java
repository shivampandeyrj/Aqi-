package com.aqicalculator.controller;

import com.aqicalculator.service.LocationAqiService;
import com.aqicalculator.service.CityInfoService;
import com.aqicalculator.service.AqiCalculatorService;
import com.aqicalculator.model.CalculationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/aqi")
@CrossOrigin(origins = "*")
public class LocationAqiController {

    private final LocationAqiService locationAqiService;
    private final CityInfoService cityInfoService;
    private final AqiCalculatorService aqiCalculatorService;

    @Autowired
    public LocationAqiController(LocationAqiService locationAqiService, 
                                 CityInfoService cityInfoService,
                                 AqiCalculatorService aqiCalculatorService) {
        this.locationAqiService = locationAqiService;
        this.cityInfoService = cityInfoService;
        this.aqiCalculatorService = aqiCalculatorService;
    }

    /**
     * GET /api/aqi/location?lat={lat}&lng={lng}
     * Fetches real-time AQI from Open-Meteo Air Quality API using coordinates.
     * No API key required — Open-Meteo is free and open.
     */
    @GetMapping("/location")
    public ResponseEntity<?> getAqiByLocation(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng) {
        try {
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid coordinates. Lat must be -90 to 90, Lng -180 to 180."));
            }

            Map<String, Object> result = locationAqiService.fetchAqi(lat, lng);
            
            // Enrich with City Information
            String cityName = (String) result.get("location");
            result.put("placeInfo", cityInfoService.fetchPlaceInfo(cityName));
            
            // Enrich with full Calculation Response data (Using 2024 EPA standards from raw PM2.5)
            double pm25 = (double) result.get("pm25");
            CalculationResponse details = aqiCalculatorService.calculateFromPm25(pm25);
            
            // Sync the main result AQI with our calculated one
            result.put("aqi", details.getAqi());
            
            details.setLocation(cityName);
            result.put("details", details);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch AQI data: " + e.getMessage()));
        }
    }

    /**
     * GET /api/aqi/suggestions?query={q}
     * Returns city name suggestions for autocomplete.
     */
    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam("query") String query) {
        return ResponseEntity.ok(cityInfoService.getSuggestions(query));
    }

    /**
     * GET /api/aqi/search?query={city}
     * Searches for monitoring stations by keyword and returns the AQI for the best match.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchAqi(
            @RequestParam("query") String query) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Query parameter is required"));
            }

            List<Map<String, Object>> stations = locationAqiService.searchStations(query);
            if (stations.isEmpty()) {
                return ResponseEntity.ok(Map.of("results", List.of(), "message", "No stations found for: " + query));
            }

            // Pick the first/best station and get its full AQI data
            Map<String, Object> bestStation = stations.get(0);
            double lat = (double) bestStation.get("lat");
            double lng = (double) bestStation.get("lng");

            return getAqiByLocation(lat, lng);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }
}
