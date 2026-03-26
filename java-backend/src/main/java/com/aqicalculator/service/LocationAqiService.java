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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LocationAqiService {

    private static final Logger logger = LoggerFactory.getLogger(LocationAqiService.class);

    private static final String WAQI_API_URL =
            "https://api.waqi.info/feed/geo:%s;%s/?token=%s";

    private static final String WAQI_SEARCH_URL =
            "https://api.waqi.info/search/?token=%s&keyword=%s";

    private static final String REVERSE_GEOCODE_URL = 
            "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=%s&longitude=%s&localityLanguage=en";

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
     * Uses reverse geocoding for accurate location names.
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
        
        // Try precise reverse geocoding first, fallback to WAQI station name
        String locationName = fetchLocationName(lat, lng);
        if (locationName == null || locationName.contains("°")) {
            locationName = dataNode.path("city").path("name").asText(locationName);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("aqi", aqiValue);
        result.put("pm25", Math.round(pm25 * 10.0) / 10.0);
        result.put("location", locationName);
        
        // Add monitoring station details for transparency
        result.put("station", dataNode.path("city").path("name").asText("Unknown Station"));
        JsonNode stationGeo = dataNode.path("city").path("geo");
        if (stationGeo.isArray() && stationGeo.size() >= 2) {
            result.put("stationLatitude", stationGeo.get(0).asDouble());
            result.put("stationLongitude", stationGeo.get(1).asDouble());
        }
        
        result.put("source", "WAQI (aqicn.org) Network");
        result.put("latitude", lat);
        result.put("longitude", lng);

        return result;
    }

    /**
     * Searches for monitoring stations by keyword.
     * @param keyword The city or station name to search for.
     * @return List of matching stations with their coordinates.
     */
    public List<Map<String, Object>> searchStations(String keyword) throws Exception {
        String url = String.format(WAQI_SEARCH_URL, waqiToken, URLEncoder.encode(keyword, StandardCharsets.UTF_8));
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());
        
        List<Map<String, Object>> results = new ArrayList<>();
        if ("ok".equals(root.path("status").asText())) {
            for (JsonNode station : root.path("data")) {
                Map<String, Object> map = new HashMap<>();
                map.put("name", station.path("station").path("name").asText());
                map.put("uid", station.path("uid").asInt());
                
                JsonNode geo = station.path("station").path("geo");
                if (geo.isArray() && geo.size() >= 2) {
                    map.put("lat", geo.get(0).asDouble());
                    map.put("lng", geo.get(1).asDouble());
                }
                results.add(map);
            }
        }
        return results;
    }

    private String fetchLocationName(double lat, double lng) {
        try {
            String url = String.format(REVERSE_GEOCODE_URL, lat, lng);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String city = root.path("city").asText();
                String locality = root.path("locality").asText();
                String principalSubdivision = root.path("principalSubdivision").asText();

                if (!city.isEmpty()) {
                    return city + (principalSubdivision.isEmpty() ? "" : ", " + principalSubdivision);
                } else if (!locality.isEmpty()) {
                    return locality + (principalSubdivision.isEmpty() ? "" : ", " + principalSubdivision);
                }
            }
        } catch (Exception e) {
            logger.error("Error during reverse geocoding fallthrough: {}", e.getMessage());
        }
        return String.format("%.4f°, %.4f°", lat, lng);
    }

}
