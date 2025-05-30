/**
 * Type definitions for the GAMAValuation module
 */

export interface Property {
  parcelId: string;
  landSquareFeet: number;
  buildingSquareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  zoning?: string;
  condition?: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  latitude?: number;
  longitude?: number;
  distanceToCenter?: number;
}

export interface ValuationResult {
  parcelId: string;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  explanation?: Record<string, any>;
  error?: string;
  timestamp: string;
}

export interface ValuationConfig {
  useAI: boolean;
  includeExplanation: boolean;
  confidenceLevel: number;
}

export interface RegressionCoefficients {
  intercept: number;
  landSquareFeet: number;
  buildingSquareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  distanceToCenter: number;
  zoning: Record<string, number>;
  condition: Record<string, number>;
  locationMultiplier: number;
}