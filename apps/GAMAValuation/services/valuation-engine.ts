/**
 * GAMA (Geographic Analysis for Mass Appraisal) Valuation Engine
 * 
 * This service is responsible for running property valuations using
 * geographic data and statistical models.
 */

import { logger } from '../utils/logger';
import { Property, ValuationResult, ValuationConfig, RegressionCoefficients } from '../types';

export class ValuationEngine {
  private config: ValuationConfig;
  private regressionCoefficients: RegressionCoefficients;

  /**
   * Create a new valuation engine
   * 
   * @param config - Configuration for the valuation engine
   */
  constructor(config: ValuationConfig) {
    this.config = {
      useAI: false,
      includeExplanation: true,
      confidenceLevel: 0.95,
      ...config
    };

    // Initialize regression coefficients with default values
    // In a real implementation, these would be derived from model training
    this.regressionCoefficients = {
      intercept: 50000,
      landSquareFeet: 2.5,
      buildingSquareFeet: 85,
      bedrooms: 15000,
      bathrooms: 25000,
      yearBuilt: 250,
      distanceToCenter: -500,
      zoning: {
        'residential': 0,
        'commercial': 25000,
        'industrial': -10000,
        'agricultural': -50000
      },
      condition: {
        'excellent': 50000,
        'good': 25000,
        'average': 0,
        'fair': -25000,
        'poor': -50000
      },
      locationMultiplier: 1
    };
  }

  /**
   * Value a single property
   * 
   * @param property - The property to value
   * @returns Valuation result
   */
  async valueProperty(property: Property): Promise<ValuationResult> {
    try {
      logger.info(`Valuing property ${property.parcelId}`);

      // Value the land
      const landValue = this.calculateLandValue(property);

      // Value the improvements
      const improvementValue = this.calculateImprovementValue(property);

      // Calculate total value
      const totalValue = landValue + improvementValue;

      // Generate explanation if requested
      const explanation = this.config.includeExplanation
        ? this.generateExplanation(property, landValue, improvementValue)
        : undefined;

      // Calculate confidence intervals
      const confidenceInterval = this.calculateConfidenceInterval(totalValue);

      return {
        parcelId: property.parcelId,
        landValue,
        improvementValue,
        totalValue,
        confidenceInterval,
        explanation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error valuing property ${property.parcelId}:`, error);
      throw new Error(`Failed to value property: ${error.message}`);
    }
  }

  /**
   * Value multiple properties in batch
   * 
   * @param properties - The properties to value
   * @returns Valuation results
   */
  async valueProperties(properties: Property[]): Promise<ValuationResult[]> {
    logger.info(`Valuing ${properties.length} properties in batch`);

    const results: ValuationResult[] = [];

    for (const property of properties) {
      try {
        const result = await this.valueProperty(property);
        results.push(result);
      } catch (error) {
        logger.error(`Error valuing property ${property.parcelId} in batch:`, error);
        
        // Add error result
        results.push({
          parcelId: property.parcelId,
          landValue: 0,
          improvementValue: 0,
          totalValue: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Calculate the land value
   * 
   * @param property - The property to value
   * @returns The calculated land value
   */
  private calculateLandValue(property: Property): number {
    const { landSquareFeet, zoning } = property;
    
    // Base value from land area
    let value = landSquareFeet * this.regressionCoefficients.landSquareFeet;
    
    // Adjust for zoning
    if (zoning && this.regressionCoefficients.zoning[zoning]) {
      value += this.regressionCoefficients.zoning[zoning];
    }
    
    // Adjust for location
    value *= this.getLocationMultiplier(property);
    
    // Apply minimum land value to prevent negative or unreasonably low values
    return Math.max(value, 5000);
  }

  /**
   * Calculate the improvement value
   * 
   * @param property - The property to value
   * @returns The calculated improvement value
   */
  private calculateImprovementValue(property: Property): number {
    const { buildingSquareFeet, bedrooms, bathrooms, yearBuilt, condition } = property;
    
    // If no building, return 0
    if (!buildingSquareFeet || buildingSquareFeet === 0) {
      return 0;
    }
    
    // Base value from building area
    let value = buildingSquareFeet * this.regressionCoefficients.buildingSquareFeet;
    
    // Add value for bedrooms
    if (bedrooms) {
      value += bedrooms * this.regressionCoefficients.bedrooms;
    }
    
    // Add value for bathrooms
    if (bathrooms) {
      value += bathrooms * this.regressionCoefficients.bathrooms;
    }
    
    // Adjust for age
    if (yearBuilt) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearBuilt;
      
      // Depreciate based on age, but flatten the curve for older buildings
      const effectiveAge = Math.min(age, 75);
      value -= effectiveAge * this.regressionCoefficients.yearBuilt;
    }
    
    // Adjust for condition
    if (condition && this.regressionCoefficients.condition[condition]) {
      value += this.regressionCoefficients.condition[condition];
    }
    
    // Ensure non-negative value
    return Math.max(value, 0);
  }

  /**
   * Get location multiplier for a property
   * 
   * @param property - The property to value
   * @returns The location multiplier
   */
  private getLocationMultiplier(property: Property): number {
    const { latitude, longitude, distanceToCenter } = property;
    
    // Base multiplier
    let multiplier = this.regressionCoefficients.locationMultiplier;
    
    // Adjust for distance to city center if available
    if (distanceToCenter !== undefined) {
      // Convert distance to miles if it's in feet
      const distanceInMiles = distanceToCenter > 1000 ? distanceToCenter / 5280 : distanceToCenter;
      
      // Reduce value by distance, but with diminishing effect
      multiplier *= Math.max(0.75, 1 - (distanceInMiles * 0.01));
    }
    
    // In a real implementation, we would use the lat/long to calculate
    // more sophisticated location factors, such as:
    // - Proximity to amenities (schools, parks, shopping)
    // - Neighborhood quality
    // - View quality
    // - Flood risk
    // - Etc.
    
    return multiplier;
  }

  /**
   * Generate explanation for a valuation
   * 
   * @param property - The property that was valued
   * @param landValue - The calculated land value
   * @param improvementValue - The calculated improvement value
   * @returns Explanation object with factors that influenced the valuation
   */
  private generateExplanation(
    property: Property,
    landValue: number,
    improvementValue: number
  ): Record<string, any> {
    const factors: Record<string, any> = {
      land: {
        size: {
          value: property.landSquareFeet,
          impact: property.landSquareFeet * this.regressionCoefficients.landSquareFeet,
          description: `Land area of ${property.landSquareFeet.toLocaleString()} square feet`
        }
      },
      improvements: {}
    };
    
    // Add zoning factor if available
    if (property.zoning && this.regressionCoefficients.zoning[property.zoning]) {
      factors.land.zoning = {
        value: property.zoning,
        impact: this.regressionCoefficients.zoning[property.zoning],
        description: `${property.zoning.charAt(0).toUpperCase() + property.zoning.slice(1)} zoning`
      };
    }
    
    // Add building factors if there are improvements
    if (improvementValue > 0) {
      if (property.buildingSquareFeet) {
        factors.improvements.size = {
          value: property.buildingSquareFeet,
          impact: property.buildingSquareFeet * this.regressionCoefficients.buildingSquareFeet,
          description: `Building area of ${property.buildingSquareFeet.toLocaleString()} square feet`
        };
      }
      
      if (property.bedrooms) {
        factors.improvements.bedrooms = {
          value: property.bedrooms,
          impact: property.bedrooms * this.regressionCoefficients.bedrooms,
          description: `${property.bedrooms} bedrooms`
        };
      }
      
      if (property.bathrooms) {
        factors.improvements.bathrooms = {
          value: property.bathrooms,
          impact: property.bathrooms * this.regressionCoefficients.bathrooms,
          description: `${property.bathrooms} bathrooms`
        };
      }
      
      if (property.yearBuilt) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - property.yearBuilt;
        const effectiveAge = Math.min(age, 75);
        const impact = -effectiveAge * this.regressionCoefficients.yearBuilt;
        
        factors.improvements.age = {
          value: age,
          impact,
          description: `Built in ${property.yearBuilt} (${age} years old)`
        };
      }
      
      if (property.condition && this.regressionCoefficients.condition[property.condition]) {
        factors.improvements.condition = {
          value: property.condition,
          impact: this.regressionCoefficients.condition[property.condition],
          description: `${property.condition.charAt(0).toUpperCase() + property.condition.slice(1)} condition`
        };
      }
    }
    
    // Add location factors
    factors.location = {
      multiplier: {
        value: this.getLocationMultiplier(property),
        description: 'Location quality multiplier'
      }
    };
    
    if (property.distanceToCenter !== undefined) {
      const distanceInMiles = property.distanceToCenter > 1000 ? property.distanceToCenter / 5280 : property.distanceToCenter;
      
      factors.location.distanceToCenter = {
        value: distanceInMiles,
        description: `${distanceInMiles.toFixed(2)} miles from city center`
      };
    }
    
    return factors;
  }

  /**
   * Calculate confidence interval for a valuation
   * 
   * @param value - The calculated value
   * @returns Confidence interval object with lower and upper bounds
   */
  private calculateConfidenceInterval(value: number): { lower: number; upper: number } {
    // In a real implementation, this would be based on statistical analysis
    // of the prediction model. For now, we'll use a simple percentage.
    const margin = value * 0.1; // 10% margin
    
    return {
      lower: Math.round(value - margin),
      upper: Math.round(value + margin)
    };
  }
}