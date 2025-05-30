/**
 * Property Valuation Engine
 * 
 * This module provides advanced property valuation capabilities, including
 * comparative market analysis, AI-powered value prediction, and adjustment calculations.
 */

import { OpenAI } from 'openai';
import { logger } from '../../../libs/DevOps/utils/logger';

// Create module-specific logger
const valuationLogger = logger.withTags(['GAMAValuation', 'ValuationEngine']);

/**
 * Property type enumeration
 */
export enum PropertyType {
  RESIDENTIAL_SINGLE_FAMILY = 'residential_single_family',
  RESIDENTIAL_MULTI_FAMILY = 'residential_multi_family',
  RESIDENTIAL_CONDO = 'residential_condo',
  RESIDENTIAL_TOWNHOUSE = 'residential_townhouse',
  RESIDENTIAL_MOBILE_HOME = 'residential_mobile_home',
  COMMERCIAL_RETAIL = 'commercial_retail',
  COMMERCIAL_OFFICE = 'commercial_office',
  COMMERCIAL_INDUSTRIAL = 'commercial_industrial',
  AGRICULTURAL = 'agricultural',
  VACANT_LAND = 'vacant_land',
  SPECIAL_PURPOSE = 'special_purpose'
}

/**
 * Valuation approach enumeration
 */
export enum ValuationApproach {
  SALES_COMPARISON = 'sales_comparison',
  COST = 'cost',
  INCOME = 'income',
  HYBRID = 'hybrid',
  AI_ASSISTED = 'ai_assisted'
}

/**
 * Valuation model
 */
export interface ValuationModel {
  id: string;
  name: string;
  description: string;
  propertyTypes: PropertyType[];
  approach: ValuationApproach;
  factors: string[];
  weights: Record<string, number>;
  algorithm: 'linear' | 'random_forest' | 'neural_network' | 'xgboost' | 'ensemble' | 'custom';
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  accuracy?: number;
  bias?: number;
  confidenceInterval?: [number, number];
}

/**
 * Property details interface
 */
export interface PropertyDetails {
  parcelId: string;
  address: string;
  propertyType: PropertyType;
  yearBuilt?: number;
  totalSquareFeet?: number;
  livingSquareFeet?: number;
  lotSizeSquareFeet?: number;
  lotSizeAcres?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  garage?: boolean;
  garageSize?: number;
  pool?: boolean;
  condition?: 'poor' | 'fair' | 'average' | 'good' | 'excellent';
  quality?: 'low' | 'below_average' | 'average' | 'above_average' | 'high' | 'luxury';
  view?: 'none' | 'limited' | 'territorial' | 'mountain' | 'water';
  location?: {
    latitude: number;
    longitude: number;
    neighborhood?: string;
    schoolDistrict?: string;
    floodZone?: string;
    zoning?: string;
  };
  improvements?: Record<string, any>[];
  features?: string[];
  priorAssessments?: {
    year: number;
    landValue: number;
    improvementValue: number;
    totalValue: number;
  }[];
  salesHistory?: {
    date: string;
    price: number;
    isCurrent: boolean;
  }[];
  additionalData?: Record<string, any>;
}

/**
 * Comparable property interface
 */
export interface ComparableProperty {
  parcelId: string;
  address: string;
  propertyType: PropertyType;
  saleDate: string;
  salePrice: number;
  yearBuilt?: number;
  totalSquareFeet?: number;
  livingSquareFeet?: number;
  lotSizeSquareFeet?: number;
  lotSizeAcres?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  garage?: boolean;
  garageSize?: number;
  pool?: boolean;
  condition?: 'poor' | 'fair' | 'average' | 'good' | 'excellent';
  quality?: 'low' | 'below_average' | 'average' | 'above_average' | 'high' | 'luxury';
  view?: 'none' | 'limited' | 'territorial' | 'mountain' | 'water';
  location?: {
    latitude: number;
    longitude: number;
    neighborhood?: string;
  };
  distanceToSubject?: number;
  similarity?: number;
  adjustments?: {
    factor: string;
    amount: number;
  }[];
  adjustedValue?: number;
}

/**
 * Income approach parameters
 */
export interface IncomeApproachParams {
  monthlyRent?: number;
  annualRent?: number;
  vacancyRate?: number;
  operatingExpenses?: number;
  operatingExpenseRatio?: number;
  capRate?: number;
  grossRentMultiplier?: number;
}

/**
 * Cost approach parameters
 */
export interface CostApproachParams {
  landValue?: number;
  replacementCostPerSqFt?: number;
  depreciationPercentage?: number;
  economicObsolescence?: number;
  functionalObsolescence?: number;
  additionalImprovementsValue?: number;
}

/**
 * AI-assisted valuation parameters
 */
export interface AIValuationParams {
  modelName?: string;
  factors?: string[];
  marketTrends?: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
    timeframe: string;
  };
  confidenceThreshold?: number;
}

/**
 * Valuation options
 */
export interface ValuationOptions {
  approach: ValuationApproach;
  comparablesCount?: number;
  maxComparableDistance?: number;
  maxComparableAgeDays?: number;
  adjustForTime?: boolean;
  adjustForLocation?: boolean;
  adjustForFeatures?: boolean;
  adjustForSize?: boolean;
  adjustForCondition?: boolean;
  adjustForAge?: boolean;
  incomeParams?: IncomeApproachParams;
  costParams?: CostApproachParams;
  aiParams?: AIValuationParams;
  modelId?: string;
  includeConfidenceScore?: boolean;
  confidenceThreshold?: number;
}

/**
 * Valuation adjustment
 */
export interface ValuationAdjustment {
  factor: string;
  amount: number;
  percentage: number;
  direction: 'positive' | 'negative';
  reasoning: string;
}

/**
 * Valuation result
 */
export interface ValuationResult {
  parcelId: string;
  address: string;
  propertyType: PropertyType;
  valuationDate: string;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  confidence: number;
  approach: ValuationApproach;
  comparables?: ComparableProperty[];
  adjustments?: ValuationAdjustment[];
  previousValue?: number;
  valueChangePercentage?: number;
  valuePerSquareFoot?: number;
  influencingFactors?: string[];
  notes?: string[];
}

/**
 * Valuation Engine class
 */
export class ValuationEngine {
  private openai: OpenAI | null = null;
  private models: ValuationModel[] = [];
  
  /**
   * Initialize the valuation engine
   */
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey
        });
        
        valuationLogger.info('Valuation Engine initialized with OpenAI integration');
      } catch (error) {
        valuationLogger.error('Failed to initialize OpenAI client', error);
      }
    } else {
      valuationLogger.warn('OpenAI API key not provided. AI-assisted valuation will be limited.');
    }
    
    // Initialize with default models
    this.initializeDefaultModels();
  }
  
  /**
   * Initialize default valuation models
   */
  private initializeDefaultModels() {
    // Residential model
    this.models.push({
      id: 'residential-comp-standard',
      name: 'Residential Comparison Standard',
      description: 'Standard sales comparison model for residential properties',
      propertyTypes: [
        PropertyType.RESIDENTIAL_SINGLE_FAMILY,
        PropertyType.RESIDENTIAL_CONDO,
        PropertyType.RESIDENTIAL_TOWNHOUSE
      ],
      approach: ValuationApproach.SALES_COMPARISON,
      factors: [
        'livingArea',
        'lotSize',
        'bedrooms',
        'bathrooms',
        'yearBuilt',
        'condition',
        'location',
        'features'
      ],
      weights: {
        livingArea: 0.25,
        lotSize: 0.15,
        bedrooms: 0.05,
        bathrooms: 0.05,
        yearBuilt: 0.10,
        condition: 0.15,
        location: 0.20,
        features: 0.05
      },
      algorithm: 'linear',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      accuracy: 0.92,
      confidenceInterval: [0.85, 0.98]
    });
    
    // Commercial model
    this.models.push({
      id: 'commercial-income-standard',
      name: 'Commercial Income Standard',
      description: 'Standard income approach model for commercial properties',
      propertyTypes: [
        PropertyType.COMMERCIAL_RETAIL,
        PropertyType.COMMERCIAL_OFFICE,
        PropertyType.COMMERCIAL_INDUSTRIAL
      ],
      approach: ValuationApproach.INCOME,
      factors: ['netOperatingIncome', 'capRate', 'occupancyRate', 'leaseTerms', 'location'],
      weights: {
        netOperatingIncome: 0.40,
        capRate: 0.25,
        occupancyRate: 0.15,
        leaseTerms: 0.10,
        location: 0.10
      },
      algorithm: 'custom',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      accuracy: 0.90,
      confidenceInterval: [0.82, 0.95]
    });
    
    // Agricultural model
    this.models.push({
      id: 'agricultural-hybrid-standard',
      name: 'Agricultural Hybrid Standard',
      description: 'Hybrid model for agricultural properties',
      propertyTypes: [PropertyType.AGRICULTURAL],
      approach: ValuationApproach.HYBRID,
      factors: [
        'acreage',
        'soilType',
        'waterRights',
        'improvements',
        'cropYield',
        'accessibility'
      ],
      weights: {
        acreage: 0.30,
        soilType: 0.20,
        waterRights: 0.20,
        improvements: 0.15,
        cropYield: 0.10,
        accessibility: 0.05
      },
      algorithm: 'ensemble',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      accuracy: 0.85,
      confidenceInterval: [0.78, 0.92]
    });
    
    // AI-assisted model
    this.models.push({
      id: 'ai-residential-advanced',
      name: 'AI Residential Advanced',
      description: 'AI-assisted model for residential properties with advanced feature analysis',
      propertyTypes: [
        PropertyType.RESIDENTIAL_SINGLE_FAMILY,
        PropertyType.RESIDENTIAL_CONDO,
        PropertyType.RESIDENTIAL_TOWNHOUSE,
        PropertyType.RESIDENTIAL_MULTI_FAMILY
      ],
      approach: ValuationApproach.AI_ASSISTED,
      factors: [
        'livingArea',
        'lotSize',
        'bedrooms',
        'bathrooms',
        'yearBuilt',
        'condition',
        'location',
        'features',
        'marketTrends',
        'schoolDistrict',
        'crimeRate',
        'walkability',
        'viewQuality'
      ],
      weights: {
        livingArea: 0.20,
        lotSize: 0.10,
        bedrooms: 0.05,
        bathrooms: 0.05,
        yearBuilt: 0.05,
        condition: 0.10,
        location: 0.15,
        features: 0.05,
        marketTrends: 0.10,
        schoolDistrict: 0.05,
        crimeRate: 0.03,
        walkability: 0.03,
        viewQuality: 0.04
      },
      algorithm: 'neural_network',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      accuracy: 0.94,
      confidenceInterval: [0.88, 0.98]
    });
  }
  
  /**
   * Register a new valuation model
   */
  registerModel(model: ValuationModel): void {
    // Check if model with this ID already exists
    const existingModelIndex = this.models.findIndex(m => m.id === model.id);
    
    if (existingModelIndex >= 0) {
      // Update existing model
      this.models[existingModelIndex] = {
        ...model,
        updatedAt: new Date()
      };
      
      valuationLogger.info(`Valuation model '${model.id}' updated`);
    } else {
      // Add new model
      this.models.push({
        ...model,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      valuationLogger.info(`Valuation model '${model.id}' registered`);
    }
  }
  
  /**
   * Get a valuation model by ID
   */
  getModel(modelId: string): ValuationModel | undefined {
    return this.models.find(model => model.id === modelId);
  }
  
  /**
   * Get all valuation models
   */
  getAllModels(): ValuationModel[] {
    return [...this.models];
  }
  
  /**
   * Get models for a specific property type
   */
  getModelsForPropertyType(propertyType: PropertyType): ValuationModel[] {
    return this.models.filter(model => model.propertyTypes.includes(propertyType));
  }
  
  /**
   * Get models for a specific valuation approach
   */
  getModelsForApproach(approach: ValuationApproach): ValuationModel[] {
    return this.models.filter(model => model.approach === approach);
  }
  
  /**
   * Valuate a property
   */
  async valuateProperty(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): Promise<ValuationResult> {
    valuationLogger.info(`Valuation started for parcel ${property.parcelId}`, {
      metadata: {
        propertyType: property.propertyType,
        approach: options.approach
      }
    });
    
    const startTime = Date.now();
    
    try {
      let valuationResult: ValuationResult;
      
      switch (options.approach) {
        case ValuationApproach.SALES_COMPARISON:
          valuationResult = await this.salesComparisonApproach(property, comparables, options);
          break;
          
        case ValuationApproach.COST:
          valuationResult = await this.costApproach(property, options);
          break;
          
        case ValuationApproach.INCOME:
          valuationResult = await this.incomeApproach(property, options);
          break;
          
        case ValuationApproach.HYBRID:
          valuationResult = await this.hybridApproach(property, comparables, options);
          break;
          
        case ValuationApproach.AI_ASSISTED:
          valuationResult = await this.aiAssistedApproach(property, comparables, options);
          break;
          
        default:
          // Default to sales comparison
          valuationResult = await this.salesComparisonApproach(property, comparables, options);
      }
      
      // Calculate additional metrics
      if (property.priorAssessments && property.priorAssessments.length > 0) {
        const previousAssessment = property.priorAssessments[0];
        valuationResult.previousValue = previousAssessment.totalValue;
        valuationResult.valueChangePercentage = 
          ((valuationResult.totalValue - previousAssessment.totalValue) / previousAssessment.totalValue) * 100;
      }
      
      if (property.livingSquareFeet && property.livingSquareFeet > 0) {
        valuationResult.valuePerSquareFoot = valuationResult.totalValue / property.livingSquareFeet;
      }
      
      // Log completion
      const duration = Date.now() - startTime;
      valuationLogger.info(`Valuation completed for parcel ${property.parcelId}`, {
        metadata: {
          duration: `${duration}ms`,
          totalValue: valuationResult.totalValue,
          confidence: valuationResult.confidence
        }
      });
      
      return valuationResult;
    } catch (error) {
      valuationLogger.error(`Valuation failed for parcel ${property.parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Sales Comparison Approach
   */
  private async salesComparisonApproach(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): Promise<ValuationResult> {
    // Filter and sort comparables
    const filteredComparables = this.filterComparables(property, comparables, options);
    
    // Apply adjustments to each comparable
    const adjustedComparables = await this.adjustComparables(property, filteredComparables, options);
    
    // Calculate weighted average of adjusted values
    let totalWeight = 0;
    let weightedValue = 0;
    
    for (const comp of adjustedComparables) {
      const weight = comp.similarity || 0.5; // Default to 0.5 if similarity is not provided
      weightedValue += comp.adjustedValue! * weight;
      totalWeight += weight;
    }
    
    const estimatedValue = totalWeight > 0 ? weightedValue / totalWeight : 0;
    
    // Calculate confidence score based on comparable quality
    const confidence = this.calculateConfidence(adjustedComparables);
    
    // Determine land vs. improvement allocation
    let landValue = 0;
    let improvementValue = 0;
    
    if (property.lotSizeSquareFeet && property.lotSizeSquareFeet > 0) {
      // Estimate land value percentage based on property type and location
      const landValuePercentage = this.estimateLandValuePercentage(property);
      landValue = estimatedValue * landValuePercentage;
      improvementValue = estimatedValue - landValue;
    } else {
      // Default split if lot size is unknown
      landValue = estimatedValue * 0.3; // Assume 30% for land
      improvementValue = estimatedValue * 0.7; // Assume 70% for improvements
    }
    
    // Create result
    const result: ValuationResult = {
      parcelId: property.parcelId,
      address: property.address,
      propertyType: property.propertyType,
      valuationDate: new Date().toISOString().split('T')[0],
      landValue: Math.round(landValue),
      improvementValue: Math.round(improvementValue),
      totalValue: Math.round(estimatedValue),
      confidence,
      approach: ValuationApproach.SALES_COMPARISON,
      comparables: adjustedComparables,
      influencingFactors: [
        'recent sales',
        'property size',
        'property condition',
        'location'
      ]
    };
    
    return result;
  }
  
  /**
   * Cost Approach
   */
  private async costApproach(
    property: PropertyDetails,
    options: ValuationOptions
  ): Promise<ValuationResult> {
    const costParams = options.costParams || {};
    
    // Estimate land value
    const landValue = costParams.landValue || this.estimateLandValue(property);
    
    // Calculate replacement cost
    let replacementCost = 0;
    if (property.livingSquareFeet && property.livingSquareFeet > 0) {
      const replacementCostPerSqFt = costParams.replacementCostPerSqFt || 
        this.estimateReplacementCostPerSqFt(property);
      
      replacementCost = property.livingSquareFeet * replacementCostPerSqFt;
    }
    
    // Calculate depreciation
    let depreciation = 0;
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      const depreciationPercentage = costParams.depreciationPercentage || 
        this.calculateDepreciationPercentage(property, age);
      
      depreciation = replacementCost * (depreciationPercentage / 100);
    }
    
    // Calculate other obsolescence
    const economicObsolescence = costParams.economicObsolescence || 0;
    const functionalObsolescence = costParams.functionalObsolescence || 0;
    
    // Calculate additional improvements value
    const additionalImprovementsValue = costParams.additionalImprovementsValue || 0;
    
    // Calculate improvement value
    const improvementValue = Math.max(0, replacementCost - depreciation - 
      economicObsolescence - functionalObsolescence) + additionalImprovementsValue;
    
    // Calculate total value
    const totalValue = landValue + improvementValue;
    
    // Calculate confidence (typically lower for cost approach)
    const confidence = 0.80;
    
    // Create result
    const result: ValuationResult = {
      parcelId: property.parcelId,
      address: property.address,
      propertyType: property.propertyType,
      valuationDate: new Date().toISOString().split('T')[0],
      landValue: Math.round(landValue),
      improvementValue: Math.round(improvementValue),
      totalValue: Math.round(totalValue),
      confidence,
      approach: ValuationApproach.COST,
      influencingFactors: [
        'replacement cost',
        'property age',
        'depreciation',
        'land value'
      ],
      notes: [
        `Replacement cost estimated at $${Math.round(replacementCost).toLocaleString()}`,
        `Depreciation estimated at ${Math.round(depreciation).toLocaleString()} (${property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : 'unknown'} years old)`
      ]
    };
    
    return result;
  }
  
  /**
   * Income Approach
   */
  private async incomeApproach(
    property: PropertyDetails,
    options: ValuationOptions
  ): Promise<ValuationResult> {
    const incomeParams = options.incomeParams || {};
    
    // Get annual rent
    let annualRent = incomeParams.annualRent || 0;
    if (!annualRent && incomeParams.monthlyRent) {
      annualRent = incomeParams.monthlyRent * 12;
    }
    
    if (!annualRent) {
      // Estimate annual rent based on property characteristics
      annualRent = this.estimateAnnualRent(property);
    }
    
    // Calculate gross income
    const vacancyRate = incomeParams.vacancyRate || 0.05; // Default 5% vacancy
    const effectiveGrossIncome = annualRent * (1 - vacancyRate);
    
    // Calculate operating expenses
    let operatingExpenses = incomeParams.operatingExpenses || 0;
    if (!operatingExpenses && incomeParams.operatingExpenseRatio) {
      operatingExpenses = effectiveGrossIncome * incomeParams.operatingExpenseRatio;
    }
    if (!operatingExpenses) {
      // Default to 40% of effective gross income if not provided
      operatingExpenses = effectiveGrossIncome * 0.4;
    }
    
    // Calculate net operating income
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    
    // Calculate value using cap rate
    const capRate = incomeParams.capRate || this.estimateCapRate(property);
    const valueByCapRate = netOperatingIncome / capRate;
    
    // Calculate value using gross rent multiplier (alternative method)
    const grossRentMultiplier = incomeParams.grossRentMultiplier || 
      this.estimateGrossRentMultiplier(property);
    const valueByGRM = annualRent * grossRentMultiplier / 12; // GRM typically uses monthly rent
    
    // Take weighted average of both methods
    const totalValue = (valueByCapRate * 0.7) + (valueByGRM * 0.3);
    
    // Estimate land value (typically a smaller percentage for income properties)
    const landValuePercentage = this.estimateLandValuePercentage(property);
    const landValue = totalValue * landValuePercentage;
    const improvementValue = totalValue - landValue;
    
    // Calculate confidence
    const confidence = 0.85;
    
    // Create result
    const result: ValuationResult = {
      parcelId: property.parcelId,
      address: property.address,
      propertyType: property.propertyType,
      valuationDate: new Date().toISOString().split('T')[0],
      landValue: Math.round(landValue),
      improvementValue: Math.round(improvementValue),
      totalValue: Math.round(totalValue),
      confidence,
      approach: ValuationApproach.INCOME,
      influencingFactors: [
        'net operating income',
        'capitalization rate',
        'gross rent multiplier',
        'vacancy rate'
      ],
      notes: [
        `Estimated annual rent: $${Math.round(annualRent).toLocaleString()}`,
        `Net operating income: $${Math.round(netOperatingIncome).toLocaleString()}`,
        `Capitalization rate: ${(capRate * 100).toFixed(2)}%`,
        `Gross rent multiplier: ${grossRentMultiplier.toFixed(2)}`
      ]
    };
    
    return result;
  }
  
  /**
   * Hybrid Approach (combines multiple methods)
   */
  private async hybridApproach(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): Promise<ValuationResult> {
    // Run multiple approaches
    const salesResult = await this.salesComparisonApproach(property, comparables, {
      ...options,
      approach: ValuationApproach.SALES_COMPARISON
    });
    
    const costResult = await this.costApproach(property, {
      ...options,
      approach: ValuationApproach.COST
    });
    
    // Use income approach only for income-producing property types
    let incomeResult: ValuationResult | null = null;
    if ([
      PropertyType.COMMERCIAL_RETAIL,
      PropertyType.COMMERCIAL_OFFICE,
      PropertyType.COMMERCIAL_INDUSTRIAL,
      PropertyType.RESIDENTIAL_MULTI_FAMILY
    ].includes(property.propertyType)) {
      incomeResult = await this.incomeApproach(property, {
        ...options,
        approach: ValuationApproach.INCOME
      });
    }
    
    // Assign weights based on property type and available data
    let salesWeight = 0.6;
    let costWeight = 0.4;
    let incomeWeight = 0;
    
    if (incomeResult) {
      // Adjust weights when income approach is available
      if ([
        PropertyType.COMMERCIAL_RETAIL,
        PropertyType.COMMERCIAL_OFFICE,
        PropertyType.COMMERCIAL_INDUSTRIAL
      ].includes(property.propertyType)) {
        // Commercial properties prioritize income approach
        salesWeight = 0.3;
        costWeight = 0.2;
        incomeWeight = 0.5;
      } else if (property.propertyType === PropertyType.RESIDENTIAL_MULTI_FAMILY) {
        // Multi-family properties balance sales and income
        salesWeight = 0.4;
        costWeight = 0.2;
        incomeWeight = 0.4;
      }
    }
    
    // Calculate weighted values
    let totalValue = 
      (salesResult.totalValue * salesWeight) + 
      (costResult.totalValue * costWeight);
      
    if (incomeResult) {
      totalValue += (incomeResult.totalValue * incomeWeight);
    }
    
    // Calculate weighted confidence
    let confidence = 
      (salesResult.confidence * salesWeight) + 
      (costResult.confidence * costWeight);
      
    if (incomeResult) {
      confidence += (incomeResult.confidence * incomeWeight);
    }
    
    // Allocate between land and improvements
    const landRatio = (
      (salesResult.landValue * salesWeight) + 
      (costResult.landValue * costWeight) + 
      (incomeResult ? (incomeResult.landValue * incomeWeight) : 0)
    ) / totalValue;
    
    const landValue = totalValue * landRatio;
    const improvementValue = totalValue - landValue;
    
    // Combine influencing factors
    const influencingFactors = [
      ...new Set([
        ...(salesResult.influencingFactors || []),
        ...(costResult.influencingFactors || []),
        ...(incomeResult?.influencingFactors || [])
      ])
    ];
    
    // Combine notes
    const notes = [
      `Sales comparison value: $${Math.round(salesResult.totalValue).toLocaleString()} (weight: ${(salesWeight * 100).toFixed(0)}%)`,
      `Cost approach value: $${Math.round(costResult.totalValue).toLocaleString()} (weight: ${(costWeight * 100).toFixed(0)}%)`
    ];
    
    if (incomeResult) {
      notes.push(`Income approach value: $${Math.round(incomeResult.totalValue).toLocaleString()} (weight: ${(incomeWeight * 100).toFixed(0)}%)`);
    }
    
    // Create result
    const result: ValuationResult = {
      parcelId: property.parcelId,
      address: property.address,
      propertyType: property.propertyType,
      valuationDate: new Date().toISOString().split('T')[0],
      landValue: Math.round(landValue),
      improvementValue: Math.round(improvementValue),
      totalValue: Math.round(totalValue),
      confidence,
      approach: ValuationApproach.HYBRID,
      comparables: salesResult.comparables,
      influencingFactors,
      notes
    };
    
    return result;
  }
  
  /**
   * AI-Assisted Approach
   */
  private async aiAssistedApproach(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): Promise<ValuationResult> {
    // Check if OpenAI is available
    if (!this.openai) {
      valuationLogger.warn('OpenAI not available for AI-assisted valuation, falling back to hybrid approach');
      
      // Fall back to hybrid approach
      return this.hybridApproach(property, comparables, {
        ...options,
        approach: ValuationApproach.HYBRID
      });
    }
    
    try {
      // First, get a baseline valuation using the hybrid approach
      const baselineValuation = await this.hybridApproach(property, comparables, {
        ...options,
        approach: ValuationApproach.HYBRID
      });
      
      // Prepare data for AI analysis
      const propertyData = this.preparePropertyDataForAI(property);
      const comparablesData = this.prepareComparablesDataForAI(comparables);
      const baselineData = {
        totalValue: baselineValuation.totalValue,
        landValue: baselineValuation.landValue,
        improvementValue: baselineValuation.improvementValue,
        confidence: baselineValuation.confidence,
        approach: baselineValuation.approach
      };
      
      // Use AI to analyze the property and recommend adjustments
      const prompt = `
        I need to value a real estate property with the following characteristics:
        
        Property Details:
        ${JSON.stringify(propertyData, null, 2)}
        
        Comparable Properties:
        ${JSON.stringify(comparablesData, null, 2)}
        
        Baseline Valuation:
        ${JSON.stringify(baselineData, null, 2)}
        
        Please analyze this property and provide:
        1. A recommended fair market value with justification
        2. Adjustments to the baseline value (if any)
        3. Key factors influencing the value
        4. Confidence level in the assessment (1-100%)
        5. Allocation between land value and improvement value
        
        Provide your response as a structured JSON object with the following schema:
        {
          "totalValue": number,
          "landValue": number,
          "improvementValue": number,
          "confidence": number (0-1 scale),
          "keyFactors": string[],
          "adjustments": [
            { "factor": string, "amount": number, "reasoning": string }
          ],
          "narrative": string
        }
      `;
      
      const response = await this.openai.chat.completions.create({
        model: options.aiParams?.modelName || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate appraiser with deep knowledge of property valuation techniques, market trends, and factors that influence property values.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Create AI-adjusted result
      const result: ValuationResult = {
        parcelId: property.parcelId,
        address: property.address,
        propertyType: property.propertyType,
        valuationDate: new Date().toISOString().split('T')[0],
        landValue: Math.round(aiResponse.landValue || baselineValuation.landValue),
        improvementValue: Math.round(aiResponse.improvementValue || baselineValuation.improvementValue),
        totalValue: Math.round(aiResponse.totalValue || baselineValuation.totalValue),
        confidence: aiResponse.confidence || baselineValuation.confidence,
        approach: ValuationApproach.AI_ASSISTED,
        comparables: baselineValuation.comparables,
        influencingFactors: aiResponse.keyFactors || baselineValuation.influencingFactors,
        adjustments: aiResponse.adjustments?.map(adj => ({
          factor: adj.factor,
          amount: adj.amount,
          percentage: (adj.amount / baselineValuation.totalValue) * 100,
          direction: adj.amount >= 0 ? 'positive' : 'negative',
          reasoning: adj.reasoning
        })) || [],
        notes: [
          ...(baselineValuation.notes || []),
          aiResponse.narrative || 'AI-assisted valuation completed'
        ]
      };
      
      return result;
    } catch (error) {
      valuationLogger.error('AI-assisted valuation failed', error);
      
      // Fall back to hybrid approach
      return this.hybridApproach(property, comparables, {
        ...options,
        approach: ValuationApproach.HYBRID
      });
    }
  }
  
  /**
   * Filter comparables based on options
   */
  private filterComparables(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): ComparableProperty[] {
    // Filter by property type
    let filtered = comparables.filter(comp => comp.propertyType === property.propertyType);
    
    // Filter by sale date (if specified)
    if (options.maxComparableAgeDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.maxComparableAgeDays);
      
      filtered = filtered.filter(comp => {
        const saleDate = new Date(comp.saleDate);
        return saleDate >= cutoffDate;
      });
    }
    
    // Filter by distance (if specified)
    if (options.maxComparableDistance && property.location) {
      filtered = filtered.filter(comp => {
        if (!comp.location || !property.location) return true;
        
        // Calculate distance
        const distance = this.calculateDistance(
          property.location.latitude,
          property.location.longitude,
          comp.location.latitude, 
          comp.location.longitude
        );
        
        // Update comparable with distance info
        comp.distanceToSubject = distance;
        
        return distance <= options.maxComparableDistance;
      });
    }
    
    // Sort by similarity or recency if not already calculated
    if (!filtered.some(comp => comp.similarity !== undefined)) {
      // Calculate similarity scores
      filtered.forEach(comp => {
        comp.similarity = this.calculateSimilarity(property, comp);
      });
    }
    
    // Sort by similarity (descending)
    filtered.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    // Limit number of comparables if specified
    if (options.comparablesCount && filtered.length > options.comparablesCount) {
      filtered = filtered.slice(0, options.comparablesCount);
    }
    
    return filtered;
  }
  
  /**
   * Apply adjustments to comparable properties
   */
  private async adjustComparables(
    property: PropertyDetails,
    comparables: ComparableProperty[],
    options: ValuationOptions
  ): Promise<ComparableProperty[]> {
    return Promise.all(comparables.map(async comp => {
      // Create a copy of the comparable with adjustments
      const adjusted = { ...comp, adjustments: [] as { factor: string; amount: number }[] };
      
      // Time adjustment (sale date)
      if (options.adjustForTime) {
        const adjustment = this.calculateTimeAdjustment(comp.saleDate);
        if (adjustment !== 0) {
          adjusted.adjustments!.push({
            factor: 'market time',
            amount: comp.salePrice * adjustment
          });
        }
      }
      
      // Location adjustment
      if (options.adjustForLocation && comp.location && property.location) {
        const adjustment = this.calculateLocationAdjustment(property, comp);
        if (adjustment !== 0) {
          adjusted.adjustments!.push({
            factor: 'location',
            amount: comp.salePrice * adjustment
          });
        }
      }
      
      // Size adjustment
      if (options.adjustForSize) {
        // Living area adjustment
        if (property.livingSquareFeet && comp.livingSquareFeet) {
          const adjustment = this.calculateSizeAdjustment(
            property.livingSquareFeet, comp.livingSquareFeet);
          
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'living area',
              amount: comp.salePrice * adjustment
            });
          }
        }
        
        // Lot size adjustment
        if (property.lotSizeSquareFeet && comp.lotSizeSquareFeet) {
          const adjustment = this.calculateLotSizeAdjustment(
            property.lotSizeSquareFeet, comp.lotSizeSquareFeet);
          
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'lot size',
              amount: comp.salePrice * adjustment
            });
          }
        }
      }
      
      // Age/condition adjustment
      if (options.adjustForAge && property.yearBuilt && comp.yearBuilt) {
        const adjustment = this.calculateAgeAdjustment(property.yearBuilt, comp.yearBuilt);
        if (adjustment !== 0) {
          adjusted.adjustments!.push({
            factor: 'age/condition',
            amount: comp.salePrice * adjustment
          });
        }
      }
      
      // Condition adjustment
      if (options.adjustForCondition && property.condition && comp.condition) {
        const adjustment = this.calculateConditionAdjustment(property.condition, comp.condition);
        if (adjustment !== 0) {
          adjusted.adjustments!.push({
            factor: 'condition',
            amount: comp.salePrice * adjustment
          });
        }
      }
      
      // Quality adjustment
      if (property.quality && comp.quality) {
        const adjustment = this.calculateQualityAdjustment(property.quality, comp.quality);
        if (adjustment !== 0) {
          adjusted.adjustments!.push({
            factor: 'quality',
            amount: comp.salePrice * adjustment
          });
        }
      }
      
      // Feature adjustments
      if (options.adjustForFeatures) {
        // Bedrooms
        if (property.bedrooms && comp.bedrooms) {
          const adjustment = this.calculateBedroomAdjustment(property.bedrooms, comp.bedrooms);
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'bedrooms',
              amount: comp.salePrice * adjustment
            });
          }
        }
        
        // Bathrooms
        if (property.bathrooms && comp.bathrooms) {
          const adjustment = this.calculateBathroomAdjustment(property.bathrooms, comp.bathrooms);
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'bathrooms',
              amount: comp.salePrice * adjustment
            });
          }
        }
        
        // Garage
        if (property.garage !== undefined && comp.garage !== undefined) {
          const adjustment = this.calculateGarageAdjustment(property.garage, comp.garage);
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'garage',
              amount: comp.salePrice * adjustment
            });
          }
        }
        
        // Pool
        if (property.pool !== undefined && comp.pool !== undefined) {
          const adjustment = this.calculatePoolAdjustment(property.pool, comp.pool);
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'pool',
              amount: comp.salePrice * adjustment
            });
          }
        }
        
        // View
        if (property.view && comp.view) {
          const adjustment = this.calculateViewAdjustment(property.view, comp.view);
          if (adjustment !== 0) {
            adjusted.adjustments!.push({
              factor: 'view',
              amount: comp.salePrice * adjustment
            });
          }
        }
      }
      
      // Calculate total adjustment
      const totalAdjustment = adjusted.adjustments!.reduce(
        (sum, adj) => sum + adj.amount, 0);
      
      // Calculate adjusted value
      adjusted.adjustedValue = comp.salePrice + totalAdjustment;
      
      return adjusted;
    }));
  }
  
  /**
   * Calculate the similarity between a subject property and a comparable
   */
  private calculateSimilarity(
    property: PropertyDetails,
    comparable: ComparableProperty
  ): number {
    let similarityScore = 0;
    let factorCount = 0;
    
    // Location similarity (highest weight)
    if (property.location && comparable.location) {
      const distance = comparable.distanceToSubject || this.calculateDistance(
        property.location.latitude,
        property.location.longitude,
        comparable.location.latitude,
        comparable.location.longitude
      );
      
      // Score inversely proportional to distance (closer = higher score)
      // Max of 0.25 for location within 0.1 miles, diminishing with distance
      const locationScore = Math.max(0, 0.25 - (distance * 0.05));
      similarityScore += locationScore;
      factorCount++;
    }
    
    // Living area similarity (0.15 weight)
    if (property.livingSquareFeet && comparable.livingSquareFeet) {
      const sizeDifference = Math.abs(property.livingSquareFeet - comparable.livingSquareFeet) / 
        property.livingSquareFeet;
      const sizeScore = 0.15 * Math.max(0, 1 - sizeDifference);
      similarityScore += sizeScore;
      factorCount++;
    }
    
    // Lot size similarity (0.10 weight)
    if (property.lotSizeSquareFeet && comparable.lotSizeSquareFeet) {
      const lotSizeDifference = Math.abs(property.lotSizeSquareFeet - comparable.lotSizeSquareFeet) / 
        property.lotSizeSquareFeet;
      const lotSizeScore = 0.10 * Math.max(0, 1 - lotSizeDifference);
      similarityScore += lotSizeScore;
      factorCount++;
    }
    
    // Age similarity (0.10 weight)
    if (property.yearBuilt && comparable.yearBuilt) {
      const ageDifference = Math.abs(property.yearBuilt - comparable.yearBuilt);
      const ageScore = 0.10 * Math.max(0, 1 - (ageDifference / 20)); // 20 years difference = 0 score
      similarityScore += ageScore;
      factorCount++;
    }
    
    // Bedrooms similarity (0.05 weight)
    if (property.bedrooms && comparable.bedrooms) {
      const bedroomDifference = Math.abs(property.bedrooms - comparable.bedrooms);
      const bedroomScore = bedroomDifference === 0 ? 0.05 : 
        bedroomDifference === 1 ? 0.03 : 0.01;
      similarityScore += bedroomScore;
      factorCount++;
    }
    
    // Bathrooms similarity (0.05 weight)
    if (property.bathrooms && comparable.bathrooms) {
      const bathroomDifference = Math.abs(property.bathrooms - comparable.bathrooms);
      const bathroomScore = bathroomDifference === 0 ? 0.05 : 
        bathroomDifference <= 0.5 ? 0.03 : 0.01;
      similarityScore += bathroomScore;
      factorCount++;
    }
    
    // Condition similarity (0.10 weight)
    if (property.condition && comparable.condition) {
      const conditionScore = property.condition === comparable.condition ? 0.10 : 
        0.10 - (this.getConditionDifference(property.condition, comparable.condition) * 0.025);
      similarityScore += Math.max(0, conditionScore);
      factorCount++;
    }
    
    // Quality similarity (0.10 weight)
    if (property.quality && comparable.quality) {
      const qualityScore = property.quality === comparable.quality ? 0.10 : 
        0.10 - (this.getQualityDifference(property.quality, comparable.quality) * 0.025);
      similarityScore += Math.max(0, qualityScore);
      factorCount++;
    }
    
    // Feature similarity (0.05 weight total)
    let featureScore = 0;
    let featureCount = 0;
    
    // Garage
    if (property.garage !== undefined && comparable.garage !== undefined) {
      featureScore += property.garage === comparable.garage ? 0.02 : 0;
      featureCount++;
    }
    
    // Pool
    if (property.pool !== undefined && comparable.pool !== undefined) {
      featureScore += property.pool === comparable.pool ? 0.02 : 0;
      featureCount++;
    }
    
    // View
    if (property.view && comparable.view) {
      featureScore += property.view === comparable.view ? 0.01 : 0;
      featureCount++;
    }
    
    if (featureCount > 0) {
      similarityScore += featureScore;
      factorCount++;
    }
    
    // Sale recency (0.10 weight)
    const saleDate = new Date(comparable.saleDate);
    const daysSinceSale = (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = 0.10 * Math.max(0, 1 - (daysSinceSale / 365)); // 1 year old = 0 score
    similarityScore += recencyScore;
    factorCount++;
    
    // Normalize score based on available factors
    const normalizedScore = factorCount > 0 ? similarityScore / factorCount : 0.5;
    
    // Scale to 0-1 range with a minimum of 0.2
    return Math.max(0.2, normalizedScore);
  }
  
  /**
   * Calculate confidence level based on comparable quality
   */
  private calculateConfidence(comparables: ComparableProperty[]): number {
    if (comparables.length === 0) {
      return 0.5; // Medium confidence with no comparables
    }
    
    // Base confidence on number of comparables
    const countScore = Math.min(1, comparables.length / 5) * 0.2; // 0-0.2 based on count (max 5)
    
    // Average similarity score
    const avgSimilarity = comparables.reduce((sum, comp) => sum + (comp.similarity || 0), 0) / 
      comparables.length;
    const similarityScore = avgSimilarity * 0.5; // 0-0.5 based on similarity
    
    // Recency of sales
    const now = new Date();
    const avgAgeDays = comparables.reduce((sum, comp) => {
      const saleDate = new Date(comp.saleDate);
      const ageDays = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + ageDays;
    }, 0) / comparables.length;
    
    const recencyScore = Math.max(0, 0.2 - (avgAgeDays / 365 * 0.2)); // 0-0.2 based on recency
    
    // Consistency of adjusted values (standard deviation)
    const adjustedValues = comparables.map(comp => comp.adjustedValue || comp.salePrice);
    const mean = adjustedValues.reduce((sum, val) => sum + val, 0) / adjustedValues.length;
    const variance = adjustedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 
      adjustedValues.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = mean > 0 ? stdDev / mean : 1;
    
    const consistencyScore = Math.max(0, 0.1 - (coeffOfVariation * 0.5)); // 0-0.1 based on consistency
    
    // Calculate total confidence
    const confidence = countScore + similarityScore + recencyScore + consistencyScore;
    
    // Ensure confidence is between 0.4 and 0.95
    return Math.min(0.95, Math.max(0.4, confidence));
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Calculate time adjustment for sale date
   */
  private calculateTimeAdjustment(saleDate: string): number {
    const sale = new Date(saleDate);
    const now = new Date();
    
    // Calculate months between sale and now
    const months = (now.getFullYear() - sale.getFullYear()) * 12 + 
      now.getMonth() - sale.getMonth();
    
    // Assume 0.5% per month market growth (adjust based on local market)
    return months * 0.005;
  }
  
  /**
   * Calculate location adjustment
   */
  private calculateLocationAdjustment(
    property: PropertyDetails,
    comparable: ComparableProperty
  ): number {
    // This would typically use neighborhood desirability factors
    // For this example, we're using a simplified approach based on distance
    
    if (!property.location || !comparable.location) {
      return 0;
    }
    
    const distance = comparable.distanceToSubject || this.calculateDistance(
      property.location.latitude,
      property.location.longitude,
      comparable.location.latitude,
      comparable.location.longitude
    );
    
    // Simple adjustment based on distance
    // Up to 5% adjustment for properties more than 1 mile away
    if (distance > 1) {
      return -0.05;
    } else if (distance > 0.5) {
      return -0.025;
    }
    
    return 0;
  }
  
  /**
   * Calculate size adjustment (living area)
   */
  private calculateSizeAdjustment(
    subjectSqFt: number,
    comparableSqFt: number
  ): number {
    const sizeDifference = subjectSqFt - comparableSqFt;
    
    // Skip small differences
    if (Math.abs(sizeDifference) < 100) {
      return 0;
    }
    
    // Use a diminishing value per square foot for larger differences
    const valuePerSqFt = 100; // $100 per square foot (adjust based on local market)
    const adjustmentFactor = sizeDifference * valuePerSqFt / comparableSqFt;
    
    // Cap the adjustment at +/- 10%
    return Math.max(-0.1, Math.min(0.1, adjustmentFactor));
  }
  
  /**
   * Calculate lot size adjustment
   */
  private calculateLotSizeAdjustment(
    subjectSqFt: number,
    comparableSqFt: number
  ): number {
    const sizeDifference = subjectSqFt - comparableSqFt;
    
    // Skip small differences
    if (Math.abs(sizeDifference) < 1000) {
      return 0;
    }
    
    // Use a diminishing value per square foot for larger differences
    const valuePerSqFt = 5; // $5 per square foot (adjust based on local market)
    const adjustmentFactor = sizeDifference * valuePerSqFt / comparableSqFt;
    
    // Cap the adjustment at +/- 5%
    return Math.max(-0.05, Math.min(0.05, adjustmentFactor));
  }
  
  /**
   * Calculate age adjustment
   */
  private calculateAgeAdjustment(
    subjectYearBuilt: number,
    comparableYearBuilt: number
  ): number {
    const ageDifference = subjectYearBuilt - comparableYearBuilt;
    
    // Skip small differences
    if (Math.abs(ageDifference) < 5) {
      return 0;
    }
    
    // 0.5% per year of age difference, up to 10%
    return Math.max(-0.1, Math.min(0.1, ageDifference * 0.005));
  }
  
  /**
   * Calculate condition adjustment
   */
  private calculateConditionAdjustment(
    subjectCondition: string,
    comparableCondition: string
  ): number {
    const conditionValues = {
      'poor': 1,
      'fair': 2,
      'average': 3,
      'good': 4,
      'excellent': 5
    };
    
    const subjectValue = conditionValues[subjectCondition] || 3;
    const comparableValue = conditionValues[comparableCondition] || 3;
    
    const conditionDifference = subjectValue - comparableValue;
    
    // 2.5% per condition level difference
    return conditionDifference * 0.025;
  }
  
  /**
   * Get condition difference level
   */
  private getConditionDifference(condition1: string, condition2: string): number {
    const conditionValues = {
      'poor': 1,
      'fair': 2,
      'average': 3,
      'good': 4,
      'excellent': 5
    };
    
    const value1 = conditionValues[condition1] || 3;
    const value2 = conditionValues[condition2] || 3;
    
    return Math.abs(value1 - value2);
  }
  
  /**
   * Calculate quality adjustment
   */
  private calculateQualityAdjustment(
    subjectQuality: string,
    comparableQuality: string
  ): number {
    const qualityValues = {
      'low': 1,
      'below_average': 2,
      'average': 3,
      'above_average': 4,
      'high': 5,
      'luxury': 6
    };
    
    const subjectValue = qualityValues[subjectQuality] || 3;
    const comparableValue = qualityValues[comparableQuality] || 3;
    
    const qualityDifference = subjectValue - comparableValue;
    
    // 3% per quality level difference
    return qualityDifference * 0.03;
  }
  
  /**
   * Get quality difference level
   */
  private getQualityDifference(quality1: string, quality2: string): number {
    const qualityValues = {
      'low': 1,
      'below_average': 2,
      'average': 3,
      'above_average': 4,
      'high': 5,
      'luxury': 6
    };
    
    const value1 = qualityValues[quality1] || 3;
    const value2 = qualityValues[quality2] || 3;
    
    return Math.abs(value1 - value2);
  }
  
  /**
   * Calculate bedroom adjustment
   */
  private calculateBedroomAdjustment(
    subjectBedrooms: number,
    comparableBedrooms: number
  ): number {
    const difference = subjectBedrooms - comparableBedrooms;
    
    // Skip if same
    if (difference === 0) {
      return 0;
    }
    
    // 2.5% per bedroom difference
    return difference * 0.025;
  }
  
  /**
   * Calculate bathroom adjustment
   */
  private calculateBathroomAdjustment(
    subjectBathrooms: number,
    comparableBathrooms: number
  ): number {
    const difference = subjectBathrooms - comparableBathrooms;
    
    // Skip if small difference
    if (Math.abs(difference) < 0.5) {
      return 0;
    }
    
    // 2% per bathroom difference
    return difference * 0.02;
  }
  
  /**
   * Calculate garage adjustment
   */
  private calculateGarageAdjustment(
    subjectHasGarage: boolean,
    comparableHasGarage: boolean
  ): number {
    if (subjectHasGarage === comparableHasGarage) {
      return 0;
    }
    
    return subjectHasGarage ? 0.03 : -0.03; // 3% adjustment for garage
  }
  
  /**
   * Calculate pool adjustment
   */
  private calculatePoolAdjustment(
    subjectHasPool: boolean,
    comparableHasPool: boolean
  ): number {
    if (subjectHasPool === comparableHasPool) {
      return 0;
    }
    
    return subjectHasPool ? 0.03 : -0.03; // 3% adjustment for pool
  }
  
  /**
   * Calculate view adjustment
   */
  private calculateViewAdjustment(
    subjectView: string,
    comparableView: string
  ): number {
    const viewValues = {
      'none': 1,
      'limited': 2,
      'territorial': 3,
      'mountain': 4,
      'water': 5
    };
    
    const subjectValue = viewValues[subjectView] || 1;
    const comparableValue = viewValues[comparableView] || 1;
    
    const viewDifference = subjectValue - comparableValue;
    
    // Skip if small difference
    if (viewDifference === 0) {
      return 0;
    }
    
    // 2% per view level difference
    return viewDifference * 0.02;
  }
  
  /**
   * Estimate land value percentage based on property type and location
   */
  private estimateLandValuePercentage(property: PropertyDetails): number {
    // Default percentages by property type (would be adjusted based on local market)
    const defaultPercentages = {
      [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 0.3, // 30% land
      [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 0.25, // 25% land
      [PropertyType.RESIDENTIAL_CONDO]: 0.15, // 15% land
      [PropertyType.RESIDENTIAL_TOWNHOUSE]: 0.2, // 20% land
      [PropertyType.RESIDENTIAL_MOBILE_HOME]: 0.4, // 40% land
      [PropertyType.COMMERCIAL_RETAIL]: 0.35, // 35% land
      [PropertyType.COMMERCIAL_OFFICE]: 0.25, // 25% land
      [PropertyType.COMMERCIAL_INDUSTRIAL]: 0.3, // 30% land
      [PropertyType.AGRICULTURAL]: 0.8, // 80% land
      [PropertyType.VACANT_LAND]: 1.0, // 100% land
      [PropertyType.SPECIAL_PURPOSE]: 0.4 // 40% land
    };
    
    return defaultPercentages[property.propertyType] || 0.3;
  }
  
  /**
   * Estimate land value based on property characteristics
   */
  private estimateLandValue(property: PropertyDetails): number {
    // If lot size is available, use per-square-foot value
    if (property.lotSizeSquareFeet && property.lotSizeSquareFeet > 0) {
      // These values would be adjusted based on local market
      const valuePerSqFt = {
        [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 10, // $10 per sq ft
        [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 15, // $15 per sq ft
        [PropertyType.RESIDENTIAL_CONDO]: 20, // $20 per sq ft
        [PropertyType.RESIDENTIAL_TOWNHOUSE]: 15, // $15 per sq ft
        [PropertyType.RESIDENTIAL_MOBILE_HOME]: 5, // $5 per sq ft
        [PropertyType.COMMERCIAL_RETAIL]: 25, // $25 per sq ft
        [PropertyType.COMMERCIAL_OFFICE]: 20, // $20 per sq ft
        [PropertyType.COMMERCIAL_INDUSTRIAL]: 8, // $8 per sq ft
        [PropertyType.AGRICULTURAL]: 1, // $1 per sq ft
        [PropertyType.VACANT_LAND]: 5, // $5 per sq ft
        [PropertyType.SPECIAL_PURPOSE]: 8 // $8 per sq ft
      };
      
      const sqFtValue = valuePerSqFt[property.propertyType] || 10;
      return property.lotSizeSquareFeet * sqFtValue;
    }
    
    // If acres are available, use per-acre value
    if (property.lotSizeAcres && property.lotSizeAcres > 0) {
      // These values would be adjusted based on local market
      const valuePerAcre = {
        [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 200000, // $200K per acre
        [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 300000, // $300K per acre
        [PropertyType.RESIDENTIAL_CONDO]: 400000, // $400K per acre
        [PropertyType.RESIDENTIAL_TOWNHOUSE]: 300000, // $300K per acre
        [PropertyType.RESIDENTIAL_MOBILE_HOME]: 100000, // $100K per acre
        [PropertyType.COMMERCIAL_RETAIL]: 500000, // $500K per acre
        [PropertyType.COMMERCIAL_OFFICE]: 400000, // $400K per acre
        [PropertyType.COMMERCIAL_INDUSTRIAL]: 200000, // $200K per acre
        [PropertyType.AGRICULTURAL]: 10000, // $10K per acre
        [PropertyType.VACANT_LAND]: 100000, // $100K per acre
        [PropertyType.SPECIAL_PURPOSE]: 150000 // $150K per acre
      };
      
      const acreValue = valuePerAcre[property.propertyType] || 200000;
      return property.lotSizeAcres * acreValue;
    }
    
    // If no size data, use a default value based on previous sales history
    if (property.priorAssessments && property.priorAssessments.length > 0) {
      const landValuePercentage = this.estimateLandValuePercentage(property);
      return property.priorAssessments[0].totalValue * landValuePercentage;
    }
    
    // Fallback to a default value
    return 100000; // $100K default land value
  }
  
  /**
   * Estimate replacement cost per square foot
   */
  private estimateReplacementCostPerSqFt(property: PropertyDetails): number {
    // Default costs by property type (would be adjusted based on local market)
    const defaultCosts = {
      [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 150, // $150 per sq ft
      [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 130, // $130 per sq ft
      [PropertyType.RESIDENTIAL_CONDO]: 160, // $160 per sq ft
      [PropertyType.RESIDENTIAL_TOWNHOUSE]: 140, // $140 per sq ft
      [PropertyType.RESIDENTIAL_MOBILE_HOME]: 80, // $80 per sq ft
      [PropertyType.COMMERCIAL_RETAIL]: 180, // $180 per sq ft
      [PropertyType.COMMERCIAL_OFFICE]: 200, // $200 per sq ft
      [PropertyType.COMMERCIAL_INDUSTRIAL]: 120, // $120 per sq ft
      [PropertyType.AGRICULTURAL]: 100, // $100 per sq ft
      [PropertyType.VACANT_LAND]: 0, // $0 per sq ft (no improvements)
      [PropertyType.SPECIAL_PURPOSE]: 180 // $180 per sq ft
    };
    
    // Adjust based on quality
    let qualityMultiplier = 1.0;
    if (property.quality) {
      const qualityMultipliers = {
        'low': 0.7,
        'below_average': 0.85,
        'average': 1.0,
        'above_average': 1.15,
        'high': 1.35,
        'luxury': 1.75
      };
      
      qualityMultiplier = qualityMultipliers[property.quality] || 1.0;
    }
    
    const baseCost = defaultCosts[property.propertyType] || 150;
    return baseCost * qualityMultiplier;
  }
  
  /**
   * Calculate depreciation percentage based on age
   */
  private calculateDepreciationPercentage(property: PropertyDetails, age: number): number {
    // Effective age factors in condition
    let effectiveAge = age;
    
    if (property.condition) {
      const conditionAdjustments = {
        'poor': 1.5, // 50% worse than actual age
        'fair': 1.2, // 20% worse than actual age
        'average': 1.0, // No adjustment
        'good': 0.8, // 20% better than actual age
        'excellent': 0.6 // 40% better than actual age
      };
      
      effectiveAge = age * (conditionAdjustments[property.condition] || 1.0);
    }
    
    // Basic depreciation calculation
    // Residential: 50-60 year useful life
    // Commercial: 40-50 year useful life
    
    let usefulLife = 50; // Default useful life
    
    if ([
      PropertyType.COMMERCIAL_RETAIL,
      PropertyType.COMMERCIAL_OFFICE,
      PropertyType.COMMERCIAL_INDUSTRIAL
    ].includes(property.propertyType)) {
      usefulLife = 40; // Commercial properties depreciate faster
    }
    
    // Calculate straight-line depreciation
    let depreciationPercentage = (effectiveAge / usefulLife) * 100;
    
    // Cap at 80% (buildings maintain some value even when fully depreciated)
    return Math.min(80, depreciationPercentage);
  }
  
  /**
   * Estimate annual rent for income approach
   */
  private estimateAnnualRent(property: PropertyDetails): number {
    // If we have living square feet, estimate based on that
    if (property.livingSquareFeet) {
      // Default monthly rent per square foot by property type
      const rentPerSqFt = {
        [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 1.2, // $1.20 per sq ft per month
        [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 1.3, // $1.30 per sq ft per month
        [PropertyType.RESIDENTIAL_CONDO]: 1.4, // $1.40 per sq ft per month
        [PropertyType.RESIDENTIAL_TOWNHOUSE]: 1.3, // $1.30 per sq ft per month
        [PropertyType.RESIDENTIAL_MOBILE_HOME]: 0.9, // $0.90 per sq ft per month
        [PropertyType.COMMERCIAL_RETAIL]: 2.0, // $2.00 per sq ft per month
        [PropertyType.COMMERCIAL_OFFICE]: 1.8, // $1.80 per sq ft per month
        [PropertyType.COMMERCIAL_INDUSTRIAL]: 0.8, // $0.80 per sq ft per month
        [PropertyType.SPECIAL_PURPOSE]: 1.5 // $1.50 per sq ft per month
      };
      
      const sqFtRent = rentPerSqFt[property.propertyType] || 1.2;
      const monthlyRent = property.livingSquareFeet * sqFtRent;
      return monthlyRent * 12;
    }
    
    // If we have bedrooms, estimate based on that for residential properties
    if (property.bedrooms && [
      PropertyType.RESIDENTIAL_SINGLE_FAMILY,
      PropertyType.RESIDENTIAL_MULTI_FAMILY,
      PropertyType.RESIDENTIAL_CONDO,
      PropertyType.RESIDENTIAL_TOWNHOUSE,
      PropertyType.RESIDENTIAL_MOBILE_HOME
    ].includes(property.propertyType)) {
      // Default monthly rent by bedroom count
      const rentByBedrooms = {
        1: 1000, // $1000 for 1BR
        2: 1400, // $1400 for 2BR
        3: 1800, // $1800 for 3BR
        4: 2200, // $2200 for 4BR
        5: 2600  // $2600 for 5BR
      };
      
      const monthlyRent = rentByBedrooms[Math.min(5, property.bedrooms)] || 1800;
      return monthlyRent * 12;
    }
    
    // If we have prior assessments, estimate based on value
    if (property.priorAssessments && property.priorAssessments.length > 0) {
      // Gross rent multiplier (inverse) - annual rent as percentage of value
      const rentPercentages = {
        [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 0.06, // 6% of value annually
        [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 0.08, // 8% of value annually
        [PropertyType.RESIDENTIAL_CONDO]: 0.07, // 7% of value annually
        [PropertyType.RESIDENTIAL_TOWNHOUSE]: 0.07, // 7% of value annually
        [PropertyType.RESIDENTIAL_MOBILE_HOME]: 0.09, // 9% of value annually
        [PropertyType.COMMERCIAL_RETAIL]: 0.08, // 8% of value annually
        [PropertyType.COMMERCIAL_OFFICE]: 0.07, // 7% of value annually
        [PropertyType.COMMERCIAL_INDUSTRIAL]: 0.06, // 6% of value annually
        [PropertyType.SPECIAL_PURPOSE]: 0.06 // 6% of value annually
      };
      
      const percentage = rentPercentages[property.propertyType] || 0.07;
      return property.priorAssessments[0].totalValue * percentage;
    }
    
    // Fallback to a default value
    return 18000; // $18K default annual rent ($1500/month)
  }
  
  /**
   * Estimate cap rate for income approach
   */
  private estimateCapRate(property: PropertyDetails): number {
    // Default cap rates by property type (would be adjusted based on local market)
    const defaultCapRates = {
      [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 0.05, // 5% cap rate
      [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 0.06, // 6% cap rate
      [PropertyType.RESIDENTIAL_CONDO]: 0.05, // 5% cap rate
      [PropertyType.RESIDENTIAL_TOWNHOUSE]: 0.055, // 5.5% cap rate
      [PropertyType.RESIDENTIAL_MOBILE_HOME]: 0.075, // 7.5% cap rate
      [PropertyType.COMMERCIAL_RETAIL]: 0.065, // 6.5% cap rate
      [PropertyType.COMMERCIAL_OFFICE]: 0.07, // 7% cap rate
      [PropertyType.COMMERCIAL_INDUSTRIAL]: 0.075, // 7.5% cap rate
      [PropertyType.SPECIAL_PURPOSE]: 0.08 // 8% cap rate
    };
    
    return defaultCapRates[property.propertyType] || 0.06;
  }
  
  /**
   * Estimate gross rent multiplier for income approach
   */
  private estimateGrossRentMultiplier(property: PropertyDetails): number {
    // Default GRMs by property type (would be adjusted based on local market)
    const defaultGRMs = {
      [PropertyType.RESIDENTIAL_SINGLE_FAMILY]: 10, // 10x annual rent
      [PropertyType.RESIDENTIAL_MULTI_FAMILY]: 8, // 8x annual rent
      [PropertyType.RESIDENTIAL_CONDO]: 9, // 9x annual rent
      [PropertyType.RESIDENTIAL_TOWNHOUSE]: 9, // 9x annual rent
      [PropertyType.RESIDENTIAL_MOBILE_HOME]: 7, // 7x annual rent
      [PropertyType.COMMERCIAL_RETAIL]: 8, // 8x annual rent
      [PropertyType.COMMERCIAL_OFFICE]: 7, // 7x annual rent
      [PropertyType.COMMERCIAL_INDUSTRIAL]: 8, // 8x annual rent
      [PropertyType.SPECIAL_PURPOSE]: 7 // 7x annual rent
    };
    
    return defaultGRMs[property.propertyType] || 8;
  }
  
  /**
   * Prepare property data for AI analysis
   */
  private preparePropertyDataForAI(property: PropertyDetails): any {
    // Filter out unnecessary fields and format for AI analysis
    return {
      parcelId: property.parcelId,
      address: property.address,
      propertyType: property.propertyType,
      yearBuilt: property.yearBuilt,
      totalSquareFeet: property.totalSquareFeet,
      livingSquareFeet: property.livingSquareFeet,
      lotSizeSquareFeet: property.lotSizeSquareFeet,
      lotSizeAcres: property.lotSizeAcres,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      stories: property.stories,
      garage: property.garage,
      pool: property.pool,
      condition: property.condition,
      quality: property.quality,
      view: property.view,
      location: property.location,
      features: property.features,
      priorAssessments: property.priorAssessments
    };
  }
  
  /**
   * Prepare comparables data for AI analysis
   */
  private prepareComparablesDataForAI(comparables: ComparableProperty[]): any[] {
    // Select a subset of top comparables with important fields
    return comparables.slice(0, 5).map(comp => ({
      parcelId: comp.parcelId,
      address: comp.address,
      saleDate: comp.saleDate,
      salePrice: comp.salePrice,
      livingSquareFeet: comp.livingSquareFeet,
      lotSizeSquareFeet: comp.lotSizeSquareFeet,
      yearBuilt: comp.yearBuilt,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      condition: comp.condition,
      quality: comp.quality,
      distanceToSubject: comp.distanceToSubject,
      similarity: comp.similarity
    }));
  }
}

// Export singleton instance
export const valuationEngine = new ValuationEngine();