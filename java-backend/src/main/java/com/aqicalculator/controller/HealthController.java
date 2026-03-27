package com.aqicalculator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.HashMap;
import java.util.Map;

/**
 * Dedicated Health Controller for Render/Railway deployment.
 * Provides multiple health check endpoints to ensure robust discovery.
 */
@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    /**
     * Minimal health check at the root for fastest response.
     */
    @GetMapping("/")
    public ResponseEntity<String> rootHealth() {
        return ResponseEntity.ok("AQI Calculator Backend is UP");
    }

    /**
     * Standard health check at /api/health for deeper integration.
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> apiHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "AQI Calculator API");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
}
