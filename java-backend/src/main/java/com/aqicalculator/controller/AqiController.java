package com.aqicalculator.controller;

import com.aqicalculator.model.CalculationResponse;
import com.aqicalculator.service.AqiCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Enable CORS for frontend
public class AqiController {

    private final AqiCalculatorService calculatorService;

    @Autowired
    public AqiController(AqiCalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    /**
     * POST /api/calculate
     * Calculate cigarette equivalent from AQI value
     * 
     * Request Body: { "aqi": 150 }
     * Response: CalculationResponse object
     */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateCigarettes(@RequestBody Map<String, Integer> request) {
        try {
            Integer aqi = request.get("aqi");
            
            if (aqi == null) {
                return ResponseEntity
                    .badRequest()
                    .body(createErrorResponse("AQI value is required"));
            }

            if (aqi < 0 || aqi > 500) {
                return ResponseEntity
                    .badRequest()
                    .body(createErrorResponse("AQI must be between 0 and 500"));
            }

            CalculationResponse response = calculatorService.calculate(aqi);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                .badRequest()
                .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("An error occurred while processing the request"));
        }
    }

    /**
     * GET /api/calculate/{aqi}
     * Alternative endpoint with AQI as path parameter
     */
    @GetMapping("/calculate/{aqi}")
    public ResponseEntity<?> calculateCigarettesGet(@PathVariable int aqi) {
        try {
            if (aqi < 0 || aqi > 500) {
                return ResponseEntity
                    .badRequest()
                    .body(createErrorResponse("AQI must be between 0 and 500"));
            }

            CalculationResponse response = calculatorService.calculate(aqi);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("An error occurred while processing the request"));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
