package com.aqicalculator.model;

public class PlaceInfo {
    private String name;
    private String summary;
    private String imageUrl;
    private String wikipediaUrl;

    public PlaceInfo() {}

    public PlaceInfo(String name, String summary, String imageUrl, String wikipediaUrl) {
        this.name = name;
        this.summary = summary;
        this.imageUrl = imageUrl;
        this.wikipediaUrl = wikipediaUrl;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getWikipediaUrl() { return wikipediaUrl; }
    public void setWikipediaUrl(String wikipediaUrl) { this.wikipediaUrl = wikipediaUrl; }
}
