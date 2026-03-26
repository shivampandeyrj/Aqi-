package com.aqicalculator.service;

import com.aqicalculator.model.CalculationResponse;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class AqiCalculatorServiceTest {

    private final AqiCalculatorService service = new AqiCalculatorService();

    @Test
    public void test2024EpaBreakpoints() {
        // Good: 0-9.0
        CalculationResponse goodValue = service.calculate(50);
        assertEquals(9.0, goodValue.getPm25(), "AQI 50 should be 9.0 ug/m3 in 2024 standard");

        // Moderate: 9.1-35.4
        CalculationResponse moderateValue = service.calculate(100);
        assertEquals(35.4, moderateValue.getPm25(), "AQI 100 should be 35.4 ug/m3");

        // Unhealthy: 125.5-225.4 (AQI 201-300)
        CalculationResponse veryUnhealthyValue = service.calculate(201);
        assertEquals(125.5, veryUnhealthyValue.getPm25(), "AQI 201 should be 125.5 ug/m3");
    }
}
