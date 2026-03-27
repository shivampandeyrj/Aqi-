package com.aqicalculator.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service to keep the application "awake" on Render Free Tier.
 * Periodically pings the application's own health endpoint.
 */
@Service
public class KeepAliveService {
    private static final Logger logger = LoggerFactory.getLogger(KeepAliveService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    
    // The public URL of the backend - Render free tier spins down without EXTERNAL traffic
    private static final String BACKEND_URL = "https://aqi-calculator-backend.onrender.com/api/health";
    private static final String FRONTEND_URL = "https://aqi-calculator-frontend.onrender.com";

    /**
     * Pings the backend and frontend every 14 minutes.
     * Render free tier spins down after 15 minutes of inactivity.
     */
    @Scheduled(fixedRate = 840000) // 14 minutes
    public void keepAlive() {
        try {
            logger.info("Self-pinging to stay awake...");
            restTemplate.getForObject(BACKEND_URL, String.class);
            restTemplate.getForObject(FRONTEND_URL, String.class);
            logger.info("Keep-alive pings successful.");
        } catch (Exception e) {
            logger.warn("Keep-alive ping failed (likely service is starting up): {}", e.getMessage());
        }
    }
}
