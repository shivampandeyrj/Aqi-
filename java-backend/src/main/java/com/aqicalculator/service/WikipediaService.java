package com.aqicalculator.service;

import com.aqicalculator.model.PlaceInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class WikipediaService {

    private static final String WIKI_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
    
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlaceInfo fetchPlaceInfo(String cityName) {
        if (cityName == null || cityName.isEmpty() || cityName.contains("°")) {
            return null; // Don't fetch for raw coordinates
        }

        try {
            // Take the first part of the city name (e.g., "Rajkot" from "Rajkot, Gujarat")
            String searchTitle = cityName.split(",")[0].trim();
            String encodedTitle = URLEncoder.encode(searchTitle.replace(" ", "_"), StandardCharsets.UTF_8);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(WIKI_API_URL + encodedTitle))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                
                String summary = root.path("extract").asText("");
                String imageUrl = root.path("thumbnail").path("source").asText(null);
                String wikiUrl = root.path("content_urls").path("desktop").path("page").asText("");
                
                // Limit summary length
                if (summary.length() > 300) {
                    summary = summary.substring(0, 297) + "...";
                }

                return new PlaceInfo(searchTitle, summary, imageUrl, wikiUrl);
            }
        } catch (Exception e) {
            // Silently fail and return null
        }
        return null;
    }
}
