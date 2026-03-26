package com.aqicalculator.model;

public class CigaretteEquivalent {
    private double perDay;
    private double perWeek;
    private double perMonth;
    private double perYear;
    private double packsPerMonth;

    public CigaretteEquivalent() {}

    public CigaretteEquivalent(double perDay) {
        this.perDay = perDay;
        this.perWeek = perDay * 7;
        this.perMonth = perDay * 30;
        this.perYear = perDay * 365;
        this.packsPerMonth = (perDay * 30) / 20; // 20 cigarettes per pack
    }

    // Getters and Setters
    public double getPerDay() { return perDay; }
    public void setPerDay(double perDay) { this.perDay = perDay; }
    
    public double getPerWeek() { return perWeek; }
    public void setPerWeek(double perWeek) { this.perWeek = perWeek; }
    
    public double getPerMonth() { return perMonth; }
    public void setPerMonth(double perMonth) { this.perMonth = perMonth; }
    
    public double getPerYear() { return perYear; }
    public void setPerYear(double perYear) { this.perYear = perYear; }
    
    public double getPacksPerMonth() { return packsPerMonth; }
    public void setPacksPerMonth(double packsPerMonth) { this.packsPerMonth = packsPerMonth; }
}
