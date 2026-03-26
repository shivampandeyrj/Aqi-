package com.aqicalculator.service;

import com.aqicalculator.model.PlaceInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class CityInfoService {
    private static final Logger logger = LoggerFactory.getLogger(CityInfoService.class);

    private static final String TELEPORT_SEARCH_URL = "https://api.teleport.org/api/cities/?search=%s";
    
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlaceInfo fetchPlaceInfo(String cityName) {
        if (cityName == null || cityName.isEmpty() || cityName.contains("°")) {
            return null;
        }

        try {
            // 1. Search for the city
            String searchTitle = cityName.split(",")[0].trim();
            String encodedCity = URLEncoder.encode(searchTitle, StandardCharsets.UTF_8);
            
            HttpRequest searchRequest = HttpRequest.newBuilder()
                    .uri(URI.create(String.format(TELEPORT_SEARCH_URL, encodedCity)))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> searchResponse = httpClient.send(searchRequest, HttpResponse.BodyHandlers.ofString());
            logger.info("Teleport search for '{}' returned status: {}", searchTitle, searchResponse.statusCode());
            
            if (searchResponse.statusCode() != 200) {
                return new PlaceInfo(searchTitle, "A beautiful location captured by our environmental analysis.", null, null);
            }

            JsonNode searchRoot = objectMapper.readTree(searchResponse.body());
            JsonNode results = searchRoot.path("_embedded").path("city:search-results");
            
            if (results.size() == 0) {
                logger.warn("No Teleport results for city search: {}", searchTitle);
                return new PlaceInfo(searchTitle, "Regional monitoring area with active air quality tracking.", null, null);
            }

            // 2. Get the city item
            String cityUrl = results.get(0).path("_links").path("city:item").path("href").asText();
            logger.info("Found Teleport city item: {}", cityUrl);
            
            HttpRequest cityRequest = HttpRequest.newBuilder().uri(URI.create(cityUrl)).GET().build();
            HttpResponse<String> cityResponse = httpClient.send(cityRequest, HttpResponse.BodyHandlers.ofString());
            
            JsonNode cityRoot = objectMapper.readTree(cityResponse.body());
            String uaUrl = cityRoot.path("_links").path("city:urban_area").path("href").asText(null);

            if (uaUrl == null) {
                logger.info("No urban area link for {}, using generic PlaceInfo", searchTitle);
                return new PlaceInfo(searchTitle, "A unique location enriched with real-time AQI and health impact data.", null, null);
            }

            // 3. Get Urban Area scores (for summary) and images
            String scoresUrl = uaUrl + "scores/";
            String imagesUrl = uaUrl + "images/";
            logger.info("Fetching urban area details: scores={}, images={}", scoresUrl, imagesUrl);

            HttpRequest scoresReq = HttpRequest.newBuilder().uri(URI.create(scoresUrl)).GET().build();
            HttpRequest imagesReq = HttpRequest.newBuilder().uri(URI.create(imagesUrl)).GET().build();

            String summary = "A significant urban center monitored for atmospheric particulate matter (PM2.5).";
            String imageUrl = null;

            try {
                HttpResponse<String> scoresRes = httpClient.send(scoresReq, HttpResponse.BodyHandlers.ofString());
                if (scoresRes.statusCode() == 200) {
                    summary = objectMapper.readTree(scoresRes.body()).path("summary").asText(summary)
                            .replaceAll("<[^>]*>", ""); // Strip HTML
                }
                
                HttpResponse<String> imagesRes = httpClient.send(imagesReq, HttpResponse.BodyHandlers.ofString());
                if (imagesRes.statusCode() == 200) {
                    imageUrl = objectMapper.readTree(imagesRes.body())
                            .path("photos").get(0).path("image").path("mobile").asText(null);
                }
            } catch (Exception e) {
                logger.warn("Partial Teleport fetch failure for {}: {}", searchTitle, e.getMessage());
            }

            logger.info("Teleport enrichment successful for: {}", searchTitle);
            return new PlaceInfo(searchTitle, summary, imageUrl, uaUrl);

        } catch (Exception e) {
            logger.error("Critical error in CityInfoService for {}: {}", cityName, e.getMessage());
            return new PlaceInfo(cityName.split(",")[0].trim(), "Environmental data point with active secondary pollutant monitoring.", null, null);
        }
    }
}
