package com.aqicalculator.model;

public class CalculationResponse {
    private int aqi;
    private double pm25;
    private CigaretteEquivalent cigarettes;
    private AqiLevel level;
    private HealthImpact healthImpact;
    private PlaceInfo placeInfo;
    private String calculationMethod;
    private String dataSource;
    private String location;


    public CalculationResponse() {}

    // Getters and Setters
    public int getAqi() { return aqi; }
    public void setAqi(int aqi) { this.aqi = aqi; }
    
    public double getPm25() { return pm25; }
    public void setPm25(double pm25) { this.pm25 = pm25; }
    
    public CigaretteEquivalent getCigarettes() { return cigarettes; }
    public void setCigarettes(CigaretteEquivalent cigarettes) { this.cigarettes = cigarettes; }
    
    public AqiLevel getLevel() { return level; }
    public void setLevel(AqiLevel level) { this.level = level; }
    
    public HealthImpact getHealthImpact() { return healthImpact; }
    public void setHealthImpact(HealthImpact healthImpact) { this.healthImpact = healthImpact; }
    
    public PlaceInfo getPlaceInfo() { return placeInfo; }
    public void setPlaceInfo(PlaceInfo placeInfo) { this.placeInfo = placeInfo; }
    
    public String getCalculationMethod() { return calculationMethod; }
    public void setCalculationMethod(String method) { this.calculationMethod = method; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String source) { this.dataSource = source; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}

