package com.aqicalculator.controller;

import com.aqicalculator.service.LocationAqiService;
import com.aqicalculator.service.CityInfoService;
import com.aqicalculator.service.AqiCalculatorService;
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
            
            // Enrich with full Calculation Response data
            int aqi = (int) result.get("aqi");
            result.put("details", aqiCalculatorService.calculate(aqi));
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch AQI data: " + e.getMessage()));
        }
    }
}
