export interface CigaretteData {
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
  packsPerMonth: number;
}

export interface HealthImpact {
  yearsOfLifeLostPerYear: number;
  minutesLostPerDay: number;
}

export interface AQILevelInfo {
  category: string;
  description: string;
  healthImplications: string;
  cautionaryStatement: string;
  color: string;
}

export interface AQILevelSummary {
  category: string;
  range: string;
  color: string;
}

export interface CalculationResult {
  aqi: number;
  pm25: number;
  cigarettes: CigaretteData;
  healthImpact: HealthImpact;
  level: AQILevelInfo;
  allLevels: AQILevelSummary[];
}
