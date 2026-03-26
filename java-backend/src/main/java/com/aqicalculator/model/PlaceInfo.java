package com.aqicalculator.model;

public class PlaceInfo {
    private String name;
    private String summary;
    private String imageUrl;
    private String sourceUrl;

    public PlaceInfo() {}

    public PlaceInfo(String name, String summary, String imageUrl, String sourceUrl) {
        this.name = name;
        this.summary = summary;
        this.imageUrl = imageUrl;
        this.sourceUrl = sourceUrl;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
}
