package com.aqicalculator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class LocationAqiService {

    private static final Logger logger = LoggerFactory.getLogger(LocationAqiService.class);

    private static final String WAQI_API_URL =
            "https://api.waqi.info/feed/geo:%s;%s/?token=%s";

    // User provided WAQI API token
    private static final String DEFAULT_WAQI_TOKEN = "f878fb06c427d5344cf95cc8de5c7dbca6a3c7e2";
    
    // Set this via environment variable WAQI_TOKEN or -Dwaqi.token=...
    private final String waqiToken = System.getProperty("waqi.token", 
            System.getenv().getOrDefault("WAQI_TOKEN", DEFAULT_WAQI_TOKEN));

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Fetches real-time air quality data from aqicn.org (WAQI) API.
     * Uses the iaqi.pm25 field for accurate PM2.5 levels.
     *
     * @param lat Latitude
     * @param lng Longitude
     * @return Map with "aqi", "pm25", "location", "source"
     */
    public Map<String, Object> fetchAqi(double lat, double lng) throws Exception {
        String apiUrl = String.format(WAQI_API_URL, lat, lng, waqiToken);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("WAQI API returned status: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (!"ok".equals(root.path("status").asText())) {
            String errorMsg = root.path("data").asText("Unknown API error");
            throw new RuntimeException("WAQI API Error: " + errorMsg);
        }

        JsonNode dataNode = root.path("data");
        
        // WAQI reports its own standardized AQI, but we'll use the raw PM2.5 
        // to stay consistent with our AqiCalculatorService logic and EPA 2024 results.
        int aqiValue = dataNode.path("aqi").asInt(0);
        double pm25 = dataNode.path("iaqi").path("pm25").path("v").asDouble(0.0);
        String cityName = dataNode.path("city").path("name").asText("Detected Location");

        Map<String, Object> result = new HashMap<>();
        result.put("aqi", aqiValue); // This is WAQI's reported AQI (usually US EPA)
        result.put("pm25", Math.round(pm25 * 10.0) / 10.0);
        result.put("location", cityName);
        result.put("source", "WAQI (aqicn.org) Observation");
        result.put("latitude", lat);
        result.put("longitude", lng);

        return result;
    }

}
