package com.aqicalculator.model;

public class HealthImpact {
    private double lifeExpectancyLossHours;
    private double minutesLostPerDay;
    private double daysLostPerYear;
    private String riskLevel;
    private String[] healthRisks;

    public HealthImpact() {}

    public HealthImpact(double lifeExpectancyLossHours, double minutesLostPerDay, 
                       double daysLostPerYear, String riskLevel, String[] healthRisks) {
        this.lifeExpectancyLossHours = lifeExpectancyLossHours;
        this.minutesLostPerDay = minutesLostPerDay;
        this.daysLostPerYear = daysLostPerYear;
        this.riskLevel = riskLevel;
        this.healthRisks = healthRisks;
    }

    // Getters and Setters
    public double getLifeExpectancyLossHours() { return lifeExpectancyLossHours; }
    public void setLifeExpectancyLossHours(double hours) { this.lifeExpectancyLossHours = hours; }
    
    public double getMinutesLostPerDay() { return minutesLostPerDay; }
    public void setMinutesLostPerDay(double minutes) { this.minutesLostPerDay = minutes; }
    
    public double getDaysLostPerYear() { return daysLostPerYear; }
    public void setDaysLostPerYear(double days) { this.daysLostPerYear = days; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public String[] getHealthRisks() { return healthRisks; }
    public void setHealthRisks(String[] healthRisks) { this.healthRisks = healthRisks; }
}
