/**
 * MeasurementTools Props Interface
 * 
 * This file defines the prop interface for the MeasurementTools component,
 * using the standardized types from the shared types library.
 */

import { Measurement, MeasurementType, DistanceUnit, AreaUnit, AngleUnit } from '../../../../libs/types';

/**
 * Props for the MeasurementTools component
 */
export interface MeasurementToolsProps {
  // Active measurement type
  activeMeasurementType?: MeasurementType;
  
  // Default distance unit
  defaultDistanceUnit?: DistanceUnit;
  
  // Default area unit
  defaultAreaUnit?: AreaUnit;
  
  // Default angle unit
  defaultAngleUnit?: AngleUnit;
  
  // Whether the tools are enabled
  enabled?: boolean;
  
  // Additional units to display
  additionalDistanceUnits?: DistanceUnit[];
  additionalAreaUnits?: AreaUnit[];
  additionalAngleUnits?: AngleUnit[];
  
  // Whether to clear measurements when changing types
  clearOnMeasurementTypeChange?: boolean;
  
  // Maximum number of measurements to keep
  maxMeasurements?: number;
  
  // Event callbacks
  onMeasurementStart?: (type: MeasurementType) => void;
  onMeasurementUpdate?: (measurement: Measurement) => void;
  onMeasurementComplete?: (measurement: Measurement) => void;
  onMeasurementClear?: () => void;
  
  // Styling options
  lineColor?: string;
  lineWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}