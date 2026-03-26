package com.aqicalculator.model;

public class AqiLevel {
    private String category;
    private String color;
    private String healthImplications;
    private String precautions;
    private int minAqi;
    private int maxAqi;

    public AqiLevel() {}

    public AqiLevel(String category, String color, String healthImplications, 
                   String precautions, int minAqi, int maxAqi) {
        this.category = category;
        this.color = color;
        this.healthImplications = healthImplications;
        this.precautions = precautions;
        this.minAqi = minAqi;
        this.maxAqi = maxAqi;
    }

    // Getters and Setters
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    public String getHealthImplications() { return healthImplications; }
    public void setHealthImplications(String healthImplications) { 
        this.healthImplications = healthImplications; 
    }
    
    public String getPrecautions() { return precautions; }
    public void setPrecautions(String precautions) { this.precautions = precautions; }
    
    public int getMinAqi() { return minAqi; }
    public void setMinAqi(int minAqi) { this.minAqi = minAqi; }
    
    public int getMaxAqi() { return maxAqi; }
    public void setMaxAqi(int maxAqi) { this.maxAqi = maxAqi; }
}
