/**
 * Legal Description Analyzer Panel Component
 * 
 * This component provides a UI for analyzing legal descriptions using
 * the LegalDescriptionAnalyzer. It allows users to input legal descriptions,
 * view analysis results, and export structured data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  X, 
  Loader2, 
  MapPin, 
  FileJson, 
  Download, 
  Copy, 
  ChevronRight, 
  ChevronDown, 
  Ruler, 
  Map,
  Share2
} from 'lucide-react';

import { 
  LegalDescriptionAnalyzer, 
  AnalyzedDescription,
  AnalysisOptions,
  IssueLevel,
  PropertyDimensions,
  PropertyLocation,
  Boundary,
  Easement
} from '../models/legal-description-analyzer';

/**
 * Panel props
 */
export interface LegalDescriptionAnalyzerPanelProps {
  // API key for OpenAI
  apiKey?: string;
  
  // Default options
  defaultOptions?: AnalysisOptions;
  
  // Event handlers
  onAnalysisComplete?: (result: AnalyzedDescription) => void;
  onExportJson?: (result: AnalyzedDescription) => void;
  onError?: (error: Error) => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Legal Description Analyzer Panel Component
 */
export const LegalDescriptionAnalyzerPanel: React.FC<LegalDescriptionAnalyzerPanelProps> = ({
  apiKey,
  defaultOptions,
  onAnalysisComplete,
  onExportJson,
  onError,
  className = '',
  style = {}
}) => {
  // State for the analyzer
  const [analyzer, setAnalyzer] = useState<LegalDescriptionAnalyzer | null>(null);
  const [isAnalyzerReady, setIsAnalyzerReady] = useState<boolean>(false);
  
  // State for user input
  const [legalDescription, setLegalDescription] = useState<string>('');
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>(
    defaultOptions || {
      includeGeospatialData: true,
      generateSimplifiedDescription: true,
      validateBoundaries: true,
      confidenceThreshold: 0.7
    }
  );
  
  // State for analysis
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedDescription | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'input' | 'result' | 'details' | 'geojson'>('input');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dimensions: true,
    location: true,
    boundaries: false,
    easements: false,
    issues: true
  });
  
  // Initialize the analyzer
  useEffect(() => {
    try {
      // Create a new analyzer instance
      const newAnalyzer = new LegalDescriptionAnalyzer();
      
      // Initialize with API key if provided
      if (apiKey) {
        newAnalyzer.initialize(apiKey);
        setIsAnalyzerReady(true);
      }
      
      setAnalyzer(newAnalyzer);
    } catch (error) {
      console.error('Failed to initialize Legal Description Analyzer', error);
      setAnalysisError('Failed to initialize the analyzer. Please check the API key.');
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [apiKey]);
  
  // Update analyzer when API key changes
  useEffect(() => {
    if (analyzer && apiKey) {
      try {
        analyzer.initialize(apiKey);
        setIsAnalyzerReady(true);
        setAnalysisError(null);
      } catch (error) {
        console.error('Failed to update API key', error);
        setAnalysisError('Failed to update API key. Please check if the key is valid.');
        setIsAnalyzerReady(false);
        
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }
  }, [apiKey, analyzer, onError]);
  
  /**
   * Handle analyze button click
   */
  const handleAnalyze = useCallback(async () => {
    if (!analyzer || !isAnalyzerReady) {
      setAnalysisError('Analyzer is not ready. Please check the API key.');
      return;
    }
    
    if (!legalDescription.trim()) {
      setAnalysisError('Please enter a legal description to analyze.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    
    try {
      // Run the analysis
      const result = await analyzer.analyze(legalDescription, analysisOptions);
      
      setAnalysisResult(result);
      setActiveTab('result');
      
      // Notify parent of analysis completion
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Analysis failed', error);
      setAnalysisError('Analysis failed: ' + (error instanceof Error ? error.message : String(error)));
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzer, isAnalyzerReady, legalDescription, analysisOptions, onAnalysisComplete, onError]);
  
  /**
   * Handle option change
   */
  const handleOptionChange = useCallback((key: keyof AnalysisOptions, value: any) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  /**
   * Handle export of JSON data
   */
  const handleExportJson = useCallback(() => {
    if (!analysisResult) return;
    
    try {
      // Create a JSON string of the result
      const jsonString = JSON.stringify(analysisResult, null, 2);
      
      // Create a download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal-analysis-${Date.now()}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Notify parent of export
      if (onExportJson) {
        onExportJson(analysisResult);
      }
    } catch (error) {
      console.error('Failed to export JSON', error);
      alert('Failed to export JSON: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [analysisResult, onExportJson]);
  
  /**
   * Copy text to clipboard
   */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  }, []);
  
  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  /**
   * Render the input panel
   */
  const renderInputPanel = () => (
    <div className="input-panel">
      {/* Description input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold', 
          fontSize: '14px'
        }}>
          Legal Description
        </label>
        <textarea
          value={legalDescription}
          onChange={(e) => setLegalDescription(e.target.value)}
          placeholder="Enter the legal property description here..."
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />
      </div>
      
      {/* Options */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          padding: '0 0 8px 0',
          borderBottom: '1px solid #e5e7eb'
        }}>
          Analysis Options
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Include geospatial data */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc'
          }}>
            <input
              type="checkbox"
              checked={analysisOptions.includeGeospatialData}
              onChange={(e) => handleOptionChange('includeGeospatialData', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span>Include Geospatial Data</span>
          </label>
          
          {/* Generate simplified description */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc'
          }}>
            <input
              type="checkbox"
              checked={analysisOptions.generateSimplifiedDescription}
              onChange={(e) => handleOptionChange('generateSimplifiedDescription', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span>Generate Simplified Description</span>
          </label>
          
          {/* Validate boundaries */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc'
          }}>
            <input
              type="checkbox"
              checked={analysisOptions.validateBoundaries}
              onChange={(e) => handleOptionChange('validateBoundaries', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span>Validate Boundaries</span>
          </label>
          
          {/* Model selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Model
            </label>
            <select
              value={analysisOptions.model || 'gpt-4o'}
              onChange={(e) => handleOptionChange('model', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            >
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, less accurate)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Analyze button */}
      <div>
        <button
          onClick={handleAnalyze}
          disabled={!isAnalyzerReady || isAnalyzing || !legalDescription.trim()}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isAnalyzerReady && !isAnalyzing && legalDescription.trim() ? '#0ea5e9' : '#94a3b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAnalyzerReady && !isAnalyzing && legalDescription.trim() ? 'pointer' : 'default',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing...
            </>
          ) : (
            <>
              <Search size={20} />
              Analyze Legal Description
            </>
          )}
        </button>
        
        {!isAnalyzerReady && (
          <div style={{ 
            marginTop: '12px', 
            color: '#f87171', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={16} />
            API key is required for analysis. Please provide a valid OpenAI API key.
          </div>
        )}
        
        {analysisError && (
          <div style={{ 
            marginTop: '12px', 
            color: '#f87171', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px' 
          }}>
            <AlertCircle size={16} />
            {analysisError}
          </div>
        )}
      </div>
    </div>
  );
  
  /**
   * Render the result panel
   */
  const renderResultPanel = () => {
    if (!analysisResult) {
      return (
        <div style={{ 
          padding: '32px 16px', 
          textAlign: 'center', 
          color: '#64748b' 
        }}>
          No analysis results yet. Please analyze a legal description first.
        </div>
      );
    }
    
    return (
      <div className="result-panel">
        {/* Summary */}
        <div style={{ 
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={18} />
            Summary
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#374151' }}>Property Type:</span>
              <span>{analysisResult.propertyType}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#374151' }}>Estimated Classification:</span>
              <span>{analysisResult.estimatedPropertyType}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#374151' }}>Area:</span>
              <span>
                {analysisResult.propertyDimensions.area 
                  ? `${analysisResult.propertyDimensions.area} ${analysisResult.propertyDimensions.areaUnit}`
                  : 'Not specified'
                }
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#374151' }}>Shape:</span>
              <span>{analysisResult.propertyDimensions.irregularShape ? 'Irregular' : 'Regular'}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold', color: '#374151' }}>Confidence Score:</span>
              <span style={{ 
                color: getConfidenceColor(analysisResult.confidence),
                fontWeight: 'bold'
              }}>
                {(analysisResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Issues summary */}
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '12px'
            }}>
              <div style={{ 
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: analysisResult.errors.length > 0 ? '#fee2e2' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: analysisResult.errors.length > 0 ? '#b91c1c' : '#64748b'
              }}>
                <AlertCircle size={16} />
                {analysisResult.errors.length} Errors
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: analysisResult.warnings.length > 0 ? '#fef3c7' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: analysisResult.warnings.length > 0 ? '#92400e' : '#64748b'
              }}>
                <AlertTriangle size={16} />
                {analysisResult.warnings.length} Warnings
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: analysisResult.notes.length > 0 ? '#e0f2fe' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: analysisResult.notes.length > 0 ? '#0369a1' : '#64748b'
              }}>
                <Info size={16} />
                {analysisResult.notes.length} Notes
              </div>
            </div>
          </div>
        </div>
        
        {/* Simplified description */}
        {analysisResult.simplifiedDescription && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={18} />
              Simplified Description
            </h3>
            
            <div style={{ 
              padding: '12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.5',
              position: 'relative'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>{analysisResult.simplifiedDescription}</p>
              
              <button
                onClick={() => copyToClipboard(analysisResult.simplifiedDescription)}
                title="Copy to clipboard"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Dimensions section */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: expandedSections.dimensions ? '8px' : '0'
            }}
            onClick={() => toggleSection('dimensions')}
          >
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Ruler size={18} />
              Property Dimensions
            </h3>
            
            {expandedSections.dimensions ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {expandedSections.dimensions && (
            <div style={{ padding: '12px' }}>
              {renderPropertyDimensions(analysisResult.propertyDimensions)}
            </div>
          )}
        </div>
        
        {/* Location section */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: expandedSections.location ? '8px' : '0'
            }}
            onClick={() => toggleSection('location')}
          >
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={18} />
              Property Location
            </h3>
            
            {expandedSections.location ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {expandedSections.location && (
            <div style={{ padding: '12px' }}>
              {renderPropertyLocation(analysisResult.propertyLocation)}
            </div>
          )}
        </div>
        
        {/* Boundaries section */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: expandedSections.boundaries ? '8px' : '0'
            }}
            onClick={() => toggleSection('boundaries')}
          >
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Map size={18} />
              Boundaries ({analysisResult.boundaries.length})
            </h3>
            
            {expandedSections.boundaries ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {expandedSections.boundaries && (
            <div style={{ padding: '12px' }}>
              {renderBoundaries(analysisResult.boundaries)}
            </div>
          )}
        </div>
        
        {/* Easements section */}
        {analysisResult.easements.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: expandedSections.easements ? '8px' : '0'
              }}
              onClick={() => toggleSection('easements')}
            >
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Share2 size={18} />
                Easements ({analysisResult.easements.length})
              </h3>
              
              {expandedSections.easements ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
            
            {expandedSections.easements && (
              <div style={{ padding: '12px' }}>
                {renderEasements(analysisResult.easements)}
              </div>
            )}
          </div>
        )}
        
        {/* Issues section */}
        <div style={{ marginBottom: '16px' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: expandedSections.issues ? '8px' : '0'
            }}
            onClick={() => toggleSection('issues')}
          >
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={18} />
              Issues & Notes
            </h3>
            
            {expandedSections.issues ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {expandedSections.issues && (
            <div style={{ padding: '12px' }}>
              {renderIssues(analysisResult)}
            </div>
          )}
        </div>
        
        {/* Export controls */}
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={handleExportJson}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FileJson size={18} />
            Export as JSON
          </button>
        </div>
      </div>
    );
  };
  
  /**
   * Render property dimensions
   */
  const renderPropertyDimensions = (dimensions: PropertyDimensions) => {
    return (
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {dimensions.width && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Width</div>
            <div>{dimensions.width} feet</div>
          </div>
        )}
        
        {dimensions.length && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Length</div>
            <div>{dimensions.length} feet</div>
          </div>
        )}
        
        {dimensions.area && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Area</div>
            <div>{dimensions.area} {dimensions.areaUnit}</div>
          </div>
        )}
        
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Shape</div>
          <div>{dimensions.irregularShape ? 'Irregular' : 'Regular'}</div>
        </div>
      </div>
    );
  };
  
  /**
   * Render property location
   */
  const renderPropertyLocation = (location: PropertyLocation) => {
    // Check if we have any location information
    const hasLocation = Object.values(location).some(value => value);
    
    if (!hasLocation) {
      return (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
          No location information available
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {location.plat && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Plat</div>
            <div>{location.plat}</div>
          </div>
        )}
        
        {location.block && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Block</div>
            <div>{location.block}</div>
          </div>
        )}
        
        {location.lot && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Lot</div>
            <div>{location.lot}</div>
          </div>
        )}
        
        {location.subdivision && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Subdivision</div>
            <div>{location.subdivision}</div>
          </div>
        )}
        
        {location.section && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Section</div>
            <div>{location.section}</div>
          </div>
        )}
        
        {location.township && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Township</div>
            <div>{location.township}</div>
          </div>
        )}
        
        {location.range && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Range</div>
            <div>{location.range}</div>
          </div>
        )}
        
        {location.county && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>County</div>
            <div>{location.county}</div>
          </div>
        )}
        
        {location.state && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>State</div>
            <div>{location.state}</div>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Render boundaries
   */
  const renderBoundaries = (boundaries: Boundary[]) => {
    if (boundaries.length === 0) {
      return (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
          No boundary information available
        </div>
      );
    }
    
    return (
      <div>
        {boundaries.map((boundary, index) => (
          <div 
            key={index}
            style={{ 
              marginBottom: index < boundaries.length - 1 ? '16px' : '0',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Boundary {index + 1}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Description</div>
              <div>{boundary.description}</div>
            </div>
            
            {boundary.length && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Length</div>
                <div>{boundary.length} feet</div>
              </div>
            )}
            
            {boundary.bearing && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Bearing</div>
                <div>{boundary.bearing}</div>
              </div>
            )}
            
            {boundary.coordinates && boundary.coordinates.length > 0 && (
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Coordinates</div>
                <div>
                  {boundary.coordinates.map((coord, idx) => (
                    <div key={idx} style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                      {coord.latitude.toFixed(6)}, {coord.longitude.toFixed(6)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  /**
   * Render easements
   */
  const renderEasements = (easements: Easement[]) => {
    if (easements.length === 0) {
      return (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
          No easements found
        </div>
      );
    }
    
    return (
      <div>
        {easements.map((easement, index) => (
          <div 
            key={index}
            style={{ 
              marginBottom: index < easements.length - 1 ? '16px' : '0',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {easement.type}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Description</div>
              <div>{easement.description}</div>
            </div>
            
            {easement.area && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Area</div>
                <div>{easement.area} {easement.areaUnit || 'square feet'}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  /**
   * Render issues
   */
  const renderIssues = (result: AnalyzedDescription) => {
    const hasIssues = result.errors.length > 0 || result.warnings.length > 0 || result.notes.length > 0;
    
    if (!hasIssues) {
      return (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
          No issues or notes found
        </div>
      );
    }
    
    return (
      <div>
        {/* Errors */}
        {result.errors.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#b91c1c' }}>
              Errors
            </div>
            
            {result.errors.map((issue, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ color: '#b91c1c', marginTop: '2px' }} />
                <div>{issue.message}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
              Warnings
            </div>
            
            {result.warnings.map((issue, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} style={{ color: '#92400e', marginTop: '2px' }} />
                <div>{issue.message}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Notes */}
        {result.notes.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0369a1' }}>
              Notes
            </div>
            
            {result.notes.map((issue, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <Info size={16} style={{ color: '#0369a1', marginTop: '2px' }} />
                <div>{issue.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Render the details panel (raw JSON)
   */
  const renderDetailsPanel = () => {
    if (!analysisResult) {
      return (
        <div style={{ 
          padding: '32px 16px', 
          textAlign: 'center', 
          color: '#64748b' 
        }}>
          No analysis results yet. Please analyze a legal description first.
        </div>
      );
    }
    
    return (
      <div className="details-panel" style={{ position: 'relative' }}>
        <button
          onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2))}
          title="Copy to clipboard"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            zIndex: 1
          }}
        >
          <Copy size={16} />
        </button>
        
        <pre
          style={{
            margin: '0',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            fontFamily: 'monospace',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {JSON.stringify(analysisResult, null, 2)}
        </pre>
      </div>
    );
  };
  
  /**
   * Render the GeoJSON panel
   */
  const renderGeoJsonPanel = () => {
    if (!analysisResult) {
      return (
        <div style={{ 
          padding: '32px 16px', 
          textAlign: 'center', 
          color: '#64748b' 
        }}>
          No analysis results yet. Please analyze a legal description first.
        </div>
      );
    }
    
    // Check if we have GeoJSON data
    const geoJSON = analysisResult.geoJSON;
    
    if (!geoJSON) {
      return (
        <div style={{ 
          padding: '32px 16px', 
          textAlign: 'center', 
          color: '#64748b' 
        }}>
          No GeoJSON data available for this analysis.
        </div>
      );
    }
    
    return (
      <div className="geojson-panel" style={{ position: 'relative' }}>
        <button
          onClick={() => copyToClipboard(JSON.stringify(geoJSON, null, 2))}
          title="Copy to clipboard"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            zIndex: 1
          }}
        >
          <Copy size={16} />
        </button>
        
        <pre
          style={{
            margin: '0',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            fontFamily: 'monospace',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {JSON.stringify(geoJSON, null, 2)}
        </pre>
      </div>
    );
  };
  
  /**
   * Get color based on confidence level
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#15803d'; // Green
    if (confidence >= 0.7) return '#0369a1'; // Blue
    if (confidence >= 0.5) return '#92400e'; // Orange
    return '#b91c1c'; // Red
  };
  
  return (
    <div 
      className={`legal-description-analyzer-panel ${className}`}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
        ...style
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Legal Description Analyzer
          </h2>
        </div>
        
        {analysisResult && (
          <div style={{ 
            marginLeft: 'auto', 
            display: 'flex', 
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveTab('input')}
              style={{
                padding: '6px 12px',
                backgroundColor: activeTab === 'input' ? '#e0f2fe' : 'transparent',
                border: '1px solid',
                borderColor: activeTab === 'input' ? '#bae6fd' : 'transparent',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Input
            </button>
            
            <button
              onClick={() => setActiveTab('result')}
              style={{
                padding: '6px 12px',
                backgroundColor: activeTab === 'result' ? '#e0f2fe' : 'transparent',
                border: '1px solid',
                borderColor: activeTab === 'result' ? '#bae6fd' : 'transparent',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Result
            </button>
            
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: '6px 12px',
                backgroundColor: activeTab === 'details' ? '#e0f2fe' : 'transparent',
                border: '1px solid',
                borderColor: activeTab === 'details' ? '#bae6fd' : 'transparent',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              JSON
            </button>
            
            {analysisResult.geoJSON && (
              <button
                onClick={() => setActiveTab('geojson')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: activeTab === 'geojson' ? '#e0f2fe' : 'transparent',
                  border: '1px solid',
                  borderColor: activeTab === 'geojson' ? '#bae6fd' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                GeoJSON
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'input' && renderInputPanel()}
        {activeTab === 'result' && renderResultPanel()}
        {activeTab === 'details' && renderDetailsPanel()}
        {activeTab === 'geojson' && renderGeoJsonPanel()}
      </div>
      
      {/* CSS for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};