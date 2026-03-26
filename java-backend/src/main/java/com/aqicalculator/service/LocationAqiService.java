package com.aqicalculator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final String OPEN_METEO_URL =
            "https://air-quality-api.open-meteo.com/v1/air-quality" +
            "?latitude=%s&longitude=%s&current=us_aqi,pm2_5&timezone=auto";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Fetches real-time AQI and PM2.5 data from Open-Meteo Air Quality API.
     * Free to use, no API key required.
     *
     * @param lat Latitude (-90 to 90)
     * @param lng Longitude (-180 to 180)
     * @return Map with "aqi" (int), "pm25" (double), "location" (string)
     */
    public Map<String, Object> fetchAqi(double lat, double lng) throws Exception {
        String url = String.format(OPEN_METEO_URL, lat, lng);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Open-Meteo API returned status: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode current = root.path("current");

        int usAqi = current.path("us_aqi").asInt(0);
        double pm25 = current.path("pm2_5").asDouble(0.0);

        // Clamp AQI to valid EPA range
        usAqi = Math.max(0, Math.min(500, usAqi));

        Map<String, Object> result = new HashMap<>();
        result.put("aqi", usAqi);
        result.put("pm25", Math.round(pm25 * 10.0) / 10.0);
        result.put("location", String.format("%.4f°, %.4f°", lat, lng));
        result.put("source", "Open-Meteo Air Quality API");
        result.put("latitude", lat);
        result.put("longitude", lng);

        return result;
    }
}
