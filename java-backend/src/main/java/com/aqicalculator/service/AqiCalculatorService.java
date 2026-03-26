package com.aqicalculator.service;

import com.aqicalculator.model.*;
import org.springframework.stereotype.Service;

@Service
public class AqiCalculatorService {

    // AQI breakpoints for PM2.5 (Updated 2024 EPA standard)
    private static final double[][] AQI_BREAKPOINTS = {
        {0.0, 9.0, 0, 50},        // Good
        {9.1, 35.4, 51, 100},     // Moderate
        {35.5, 55.4, 101, 150},   // Unhealthy for Sensitive
        {55.5, 125.4, 151, 200},  // Unhealthy
        {125.5, 225.4, 201, 300}, // Very Unhealthy
        {225.5, 325.4, 301, 500}  // Hazardous
    };

    // Berkeley Earth Research: 22 µg/m³ PM2.5 = 1 cigarette
    private static final double PM25_PER_CIGARETTE = 22.0;

    /**
     * Main calculation method - converts AQI to cigarette equivalent
     */
    public int calculateAqiFromPm25(double pm25) {
        for (double[] bp : AQI_BREAKPOINTS) {
            double cLow = bp[0];
            double cHigh = bp[1];
            double iLow = bp[2];
            double iHigh = bp[3];

            if (pm25 >= cLow && pm25 <= cHigh) {
                // EPA formula: I = ((Ih - Il) / (Ch - Cl)) * (C - Cl) + Il
                double aqi = ((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow;
                return (int) Math.round(aqi);
            }
        }
        // Fallback or beyond hazardous range
        if (pm25 > 500.4) return 500;
        return (int) Math.round(pm25 * 2.0);
    }

    public CalculationResponse calculate(int aqi) {
        double pm25 = convertAqiToPm25(aqi);
        return createResponse(aqi, pm25);
    }

    public CalculationResponse calculateFromPm25(double pm25) {
        int aqi = calculateAqiFromPm25(pm25);
        return createResponse(aqi, pm25);
    }

    private CalculationResponse createResponse(int aqi, double pm25) {
        CalculationResponse response = new CalculationResponse();
        response.setAqi(aqi);
        response.setPm25(Math.round(pm25 * 10.0) / 10.0);

        // Calculate cigarette equivalent
        double cigarettesPerDay = pm25 / PM25_PER_CIGARETTE;
        response.setCigarettes(new CigaretteEquivalent(
            Math.round(cigarettesPerDay * 100.0) / 100.0
        ));

        // Get AQI level information
        response.setLevel(getAqiLevel(aqi));

        // Calculate health impact
        response.setHealthImpact(calculateHealthImpact(cigarettesPerDay, aqi));

        // Meta information
        response.setCalculationMethod("Berkeley Earth Research Formula (2024 EPA)");
        response.setDataSource("WAQI Observations & Berkeley Earth Study");

        return response;
    }

    /**
     * Converts AQI value to PM2.5 concentration using EPA formula
     */
    private double convertAqiToPm25(int aqi) {
        for (double[] bp : AQI_BREAKPOINTS) {
            double cLow = bp[0];
            double cHigh = bp[1];
            double iLow = bp[2];
            double iHigh = bp[3];

            if (aqi >= iLow && aqi <= iHigh) {
                // EPA formula: C = ((Cp - Cl) / (Ih - Il)) * (I - Il) + Cl
                return ((cHigh - cLow) / (iHigh - iLow)) * (aqi - iLow) + cLow;
            }
        }
        return aqi * 0.5; // Fallback estimation
    }

    /**
     * Returns AQI level information based on AQI value
     */
    private AqiLevel getAqiLevel(int aqi) {
        if (aqi <= 50) {
            return new AqiLevel(
                "Good",
                "#22C55E",
                "Air quality is satisfactory, and air pollution poses little or no risk.",
                "None needed. Enjoy outdoor activities!",
                0, 50
            );
        } else if (aqi <= 100) {
            return new AqiLevel(
                "Moderate",
                "#EAB308",
                "Air quality is acceptable. However, there may be a risk for some people.",
                "Unusually sensitive people should consider reducing prolonged outdoor exertion.",
                51, 100
            );
        } else if (aqi <= 150) {
            return new AqiLevel(
                "Unhealthy for Sensitive Groups",
                "#F97316",
                "Members of sensitive groups may experience health effects.",
                "People with respiratory or heart disease, elderly, and children should limit prolonged outdoor exertion.",
                101, 150
            );
        } else if (aqi <= 200) {
            return new AqiLevel(
                "Unhealthy",
                "#EF4444",
                "Everyone may begin to experience health effects.",
                "Everyone should limit prolonged outdoor exertion. Consider moving activities indoors.",
                151, 200
            );
        } else if (aqi <= 300) {
            return new AqiLevel(
                "Very Unhealthy",
                "#9333EA",
                "Health warnings of emergency conditions. Entire population affected.",
                "Avoid all outdoor exertion. Keep windows closed. Use air purifiers indoors.",
                201, 300
            );
        } else {
            return new AqiLevel(
                "Hazardous",
                "#7F1D1D",
                "Health alert: everyone may experience more serious health effects.",
                "STAY INDOORS. Avoid all physical activity. Seek medical attention if experiencing symptoms.",
                301, 500
            );
        }
    }

    /**
     * Calculates health impact based on cigarette equivalent and AQI
     */
    private HealthImpact calculateHealthImpact(double cigarettesPerDay, int aqi) {
        // Each cigarette reduces life expectancy by ~11 minutes (medical research)
        double minutesLostPerDay = cigarettesPerDay * 11;
        double hoursLostPerYear = (minutesLostPerDay * 365) / 60;
        double daysLostPerYear = minutesLostPerDay * 365 / 1440.0;
        
        String riskLevel = determineRiskLevel(aqi);
        String[] healthRisks = getHealthRisks(aqi);

        return new HealthImpact(
            Math.round(hoursLostPerYear * 10.0) / 10.0,
            Math.round(minutesLostPerDay * 10.0) / 10.0,
            Math.round(daysLostPerYear * 10.0) / 10.0,
            riskLevel,
            healthRisks
        );
    }

    private String determineRiskLevel(int aqi) {
        if (aqi <= 50) {
            return "Low";
        } else if (aqi <= 100) {
            return "Moderate";
        } else if (aqi <= 150) {
            return "High";
        } else if (aqi <= 200) {
            return "Very High";
        } else {
            return "Severe";
        }
    }

    private String[] getHealthRisks(int aqi) {
        if (aqi <= 50) {
            return new String[]{
                "Minimal respiratory impact",
                "Safe for all activities"
            };
        } else if (aqi <= 100) {
            return new String[]{
                "Possible mild respiratory irritation",
                "Sensitive individuals may notice effects"
            };
        } else if (aqi <= 150) {
            return new String[]{
                "Increased risk of respiratory symptoms",
                "Aggravated asthma and heart disease",
                "Reduced lung function"
            };
        } else if (aqi <= 200) {
            return new String[]{
                "Significant respiratory effects",
                "Cardiovascular stress",
                "Increased hospital admissions",
                "Premature mortality risk"
            };
        } else {
            return new String[]{
                "Serious respiratory illness",
                "Heart attack risk increased",
                "Stroke risk increased",
                "Significant life expectancy reduction",
                "Emergency health conditions possible"
            };
        }
    }
}
