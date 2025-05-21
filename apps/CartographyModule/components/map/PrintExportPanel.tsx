/**
 * Print Export Panel Component
 * 
 * This component provides a comprehensive interface for printing and exporting maps
 * in various formats, with options for customizing the output.
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Copy, 
  Share2, 
  Sliders, 
  X, 
  Check, 
  Loader2, 
  ArrowRight, 
  Save, 
  Info
} from 'lucide-react';

import { logger } from '../../../../libs/DevOps/utils/logger';

// Create module-specific logger
const printLogger = logger.withTags(['CartographyModule', 'PrintExportPanel']);

/**
 * Paper size
 */
export enum PaperSize {
  LETTER = 'letter',
  LEGAL = 'legal',
  TABLOID = 'tabloid',
  A4 = 'a4',
  A3 = 'a3',
  CUSTOM = 'custom'
}

/**
 * Print orientation
 */
export enum PrintOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

/**
 * Export format
 */
export enum ExportFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  PDF = 'pdf',
  SVG = 'svg',
  GEOJSON = 'geojson',
  KML = 'kml'
}

/**
 * Print quality
 */
export enum PrintQuality {
  DRAFT = 'draft',
  NORMAL = 'normal',
  HIGH = 'high'
}

/**
 * Print/export options
 */
export interface PrintExportOptions {
  // Paper settings
  paperSize: PaperSize;
  orientation: PrintOrientation;
  customWidth?: number;
  customHeight?: number;
  
  // Content settings
  title: string;
  description: string;
  showLegend: boolean;
  showScale: boolean;
  showNorth: boolean;
  showAttribution: boolean;
  
  // Export settings
  format: ExportFormat;
  quality: PrintQuality;
  dpi: number;
  
  // Advanced settings
  includeMargin: boolean;
  marginSize: number;
}

/**
 * Print export panel props
 */
export interface PrintExportPanelProps {
  // Map instance (can be mapbox, leaflet, etc.)
  mapInstance?: any;
  
  // Map information
  mapTitle?: string;
  countyName?: string;
  mapCenterCoordinates?: { lat: number; lng: number };
  
  // Default options
  defaultOptions?: Partial<PrintExportOptions>;
  
  // Available formats (if limited)
  availableFormats?: ExportFormat[];
  
  // Event handlers
  onPrint?: (options: PrintExportOptions) => void;
  onExport?: (options: PrintExportOptions) => Promise<string>;
  onShare?: (options: PrintExportOptions) => Promise<string>;
  onClose?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Paper size dimensions in inches
 */
const PAPER_SIZES: Record<PaperSize, { width: number; height: number; name: string }> = {
  [PaperSize.LETTER]: { width: 8.5, height: 11, name: 'Letter (8.5 × 11 in)' },
  [PaperSize.LEGAL]: { width: 8.5, height: 14, name: 'Legal (8.5 × 14 in)' },
  [PaperSize.TABLOID]: { width: 11, height: 17, name: 'Tabloid (11 × 17 in)' },
  [PaperSize.A4]: { width: 8.27, height: 11.69, name: 'A4 (210 × 297 mm)' },
  [PaperSize.A3]: { width: 11.69, height: 16.54, name: 'A3 (297 × 420 mm)' },
  [PaperSize.CUSTOM]: { width: 8.5, height: 11, name: 'Custom Size' }
};

/**
 * Format information
 */
const FORMAT_INFO: Record<ExportFormat, { name: string; description: string; icon: React.ReactNode }> = {
  [ExportFormat.PNG]: { 
    name: 'PNG Image', 
    description: 'Lossless image format with transparency support',
    icon: <ImageIcon size={16} />
  },
  [ExportFormat.JPEG]: { 
    name: 'JPEG Image', 
    description: 'Compressed image format, smaller file size',
    icon: <ImageIcon size={16} />
  },
  [ExportFormat.PDF]: { 
    name: 'PDF Document', 
    description: 'Vector-based document, best for printing',
    icon: <FileText size={16} />
  },
  [ExportFormat.SVG]: { 
    name: 'SVG Image', 
    description: 'Scalable vector graphic, best for web',
    icon: <ImageIcon size={16} />
  },
  [ExportFormat.GEOJSON]: { 
    name: 'GeoJSON', 
    description: 'Geographic data format for GIS applications',
    icon: <FileText size={16} />
  },
  [ExportFormat.KML]: { 
    name: 'KML', 
    description: 'Keyhole Markup Language for Google Earth',
    icon: <FileText size={16} />
  }
};

/**
 * Quality information
 */
const QUALITY_INFO: Record<PrintQuality, { name: string; description: string; dpi: number }> = {
  [PrintQuality.DRAFT]: { 
    name: 'Draft', 
    description: 'Low resolution, faster export',
    dpi: 96
  },
  [PrintQuality.NORMAL]: { 
    name: 'Normal', 
    description: 'Standard resolution, balanced quality',
    dpi: 150
  },
  [PrintQuality.HIGH]: { 
    name: 'High', 
    description: 'High resolution, best quality',
    dpi: 300
  }
};

/**
 * Print Export Panel Component
 */
export const PrintExportPanel: React.FC<PrintExportPanelProps> = ({
  mapInstance,
  mapTitle = 'Map Export',
  countyName,
  mapCenterCoordinates,
  defaultOptions,
  availableFormats = [
    ExportFormat.PNG, 
    ExportFormat.JPEG, 
    ExportFormat.PDF, 
    ExportFormat.SVG
  ],
  onPrint,
  onExport,
  onShare,
  onClose,
  className = '',
  style = {},
  position = 'top-right'
}) => {
  // File input reference
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  
  // State for panel mode
  const [mode, setMode] = useState<'print' | 'export' | 'share'>('export');
  
  // State for options
  const [options, setOptions] = useState<PrintExportOptions>({
    paperSize: PaperSize.LETTER,
    orientation: PrintOrientation.PORTRAIT,
    title: mapTitle,
    description: countyName ? `Map of ${countyName}` : '',
    showLegend: true,
    showScale: true,
    showNorth: true,
    showAttribution: true,
    format: ExportFormat.PDF,
    quality: PrintQuality.NORMAL,
    dpi: QUALITY_INFO[PrintQuality.NORMAL].dpi,
    includeMargin: true,
    marginSize: 0.5,
    ...defaultOptions
  });
  
  // State for preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State for operation status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  
  /**
   * Update option
   */
  const updateOption = useCallback(<K extends keyof PrintExportOptions>(
    key: K, 
    value: PrintExportOptions[K]
  ) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset complete state when options change
    setIsComplete(false);
    setError(null);
    
    // Update DPI when quality changes
    if (key === 'quality' && QUALITY_INFO[value as PrintQuality]) {
      setOptions(prev => ({
        ...prev,
        dpi: QUALITY_INFO[value as PrintQuality].dpi
      }));
    }
    
    // Update orientation if paper size changes
    if (key === 'paperSize') {
      // If switching to a non-custom size, ensure we're not using custom width/height
      if (value !== PaperSize.CUSTOM) {
        setOptions(prev => ({
          ...prev,
          customWidth: undefined,
          customHeight: undefined
        }));
      } else {
        // If switching to custom, initialize with letter size
        setOptions(prev => ({
          ...prev,
          customWidth: 8.5,
          customHeight: 11
        }));
      }
    }
  }, []);
  
  /**
   * Handle print button click
   */
  const handlePrint = useCallback(async () => {
    try {
      setIsProcessing(true);
      setIsComplete(false);
      setError(null);
      
      printLogger.info('Printing map', options);
      
      if (onPrint) {
        await onPrint(options);
      } else {
        // Default print implementation using browser print
        window.print();
      }
      
      setIsComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to print: ${errorMessage}`);
      printLogger.error('Print failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [options, onPrint]);
  
  /**
   * Handle export button click
   */
  const handleExport = useCallback(async () => {
    try {
      setIsProcessing(true);
      setIsComplete(false);
      setError(null);
      setExportUrl(null);
      
      printLogger.info('Exporting map', options);
      
      if (onExport) {
        const url = await onExport(options);
        setExportUrl(url);
        
        // Automatically trigger download
        if (downloadLinkRef.current && url) {
          downloadLinkRef.current.href = url;
          downloadLinkRef.current.download = `map-export-${Date.now()}.${options.format}`;
          downloadLinkRef.current.click();
        }
      } else {
        // Default export implementation using canvas
        if (!mapInstance) {
          throw new Error('Map instance is required for export');
        }
        
        // Generate export from map canvas
        const canvas = mapInstance.getCanvas();
        if (!canvas) {
          throw new Error('Map canvas not available');
        }
        
        // Convert canvas to data URL
        const format = options.format === ExportFormat.JPEG ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(format, options.quality === PrintQuality.HIGH ? 1.0 : 0.8);
        
        setExportUrl(dataUrl);
        
        // Trigger download
        if (downloadLinkRef.current) {
          downloadLinkRef.current.href = dataUrl;
          downloadLinkRef.current.download = `map-export-${Date.now()}.${
            options.format === ExportFormat.JPEG ? 'jpg' : 'png'
          }`;
          downloadLinkRef.current.click();
        }
      }
      
      setIsComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to export: ${errorMessage}`);
      printLogger.error('Export failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [options, onExport, mapInstance]);
  
  /**
   * Handle share button click
   */
  const handleShare = useCallback(async () => {
    try {
      setIsProcessing(true);
      setIsComplete(false);
      setError(null);
      setShareUrl(null);
      
      printLogger.info('Sharing map', options);
      
      if (onShare) {
        const url = await onShare(options);
        setShareUrl(url);
      } else {
        // Default share implementation using current URL
        const shareUrl = window.location.href;
        setShareUrl(shareUrl);
        
        // Try using Web Share API if available
        if (navigator.share) {
          await navigator.share({
            title: options.title || 'Shared Map',
            text: options.description || 'Check out this map',
            url: shareUrl
          });
        }
      }
      
      setIsComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to share: ${errorMessage}`);
      printLogger.error('Share failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [options, onShare]);
  
  /**
   * Copy share URL to clipboard
   */
  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      printLogger.info('Share URL copied to clipboard');
      alert('Share URL copied to clipboard');
    } catch (err) {
      printLogger.error('Failed to copy share URL', err);
      alert('Failed to copy URL. Please select and copy manually.');
    }
  }, [shareUrl]);
  
  /**
   * Generate preview
   */
  const generatePreview = useCallback(() => {
    try {
      // This is a placeholder for preview generation
      // In a real implementation, this would create a preview image
      printLogger.debug('Generating preview', options);
      
      // For now, just use a placeholder or the map canvas
      if (mapInstance) {
        const canvas = mapInstance.getCanvas();
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png', 0.5);
          setPreviewUrl(dataUrl);
        }
      }
    } catch (err) {
      printLogger.error('Failed to generate preview', err);
    }
  }, [options, mapInstance]);
  
  /**
   * Get current paper size dimensions
   */
  const getPaperDimensions = useCallback(() => {
    let width: number;
    let height: number;
    
    if (options.paperSize === PaperSize.CUSTOM) {
      width = options.customWidth || 8.5;
      height = options.customHeight || 11;
    } else {
      const paperSize = PAPER_SIZES[options.paperSize];
      width = paperSize.width;
      height = paperSize.height;
    }
    
    // Swap dimensions for landscape orientation
    if (options.orientation === PrintOrientation.LANDSCAPE) {
      [width, height] = [height, width];
    }
    
    return { width, height };
  }, [options.paperSize, options.orientation, options.customWidth, options.customHeight]);
  
  /**
   * Calculate aspect ratio
   */
  const calculateAspectRatio = useCallback(() => {
    const { width, height } = getPaperDimensions();
    return width / height;
  }, [getPaperDimensions]);
  
  /**
   * Handle close button click
   */
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // Determine container classes based on position
  const containerClasses = `print-export-panel ${position} ${className}`;
  
  // Get position style based on position prop
  const positionStyle = getPositionStyle(position);
  
  // Calculate paper aspect ratio for preview
  const aspectRatio = calculateAspectRatio();
  
  return (
    <div 
      className={containerClasses}
      style={{ 
        position: 'absolute',
        ...positionStyle,
        width: '360px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {mode === 'print' ? 'Print Map' : mode === 'export' ? 'Export Map' : 'Share Map'}
        </h3>
        
        <button 
          onClick={handleClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Mode tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button 
          onClick={() => setMode('export')}
          style={{
            flex: 1,
            padding: '10px',
            background: mode === 'export' ? '#f1f5f9' : 'transparent',
            border: 'none',
            borderBottom: mode === 'export' ? '2px solid #0ea5e9' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: mode === 'export' ? 'bold' : 'normal',
            color: mode === 'export' ? '#0f172a' : '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Download size={16} />
            Export
          </div>
        </button>
        
        <button 
          onClick={() => setMode('print')}
          style={{
            flex: 1,
            padding: '10px',
            background: mode === 'print' ? '#f1f5f9' : 'transparent',
            border: 'none',
            borderBottom: mode === 'print' ? '2px solid #0ea5e9' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: mode === 'print' ? 'bold' : 'normal',
            color: mode === 'print' ? '#0f172a' : '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Printer size={16} />
            Print
          </div>
        </button>
        
        <button 
          onClick={() => setMode('share')}
          style={{
            flex: 1,
            padding: '10px',
            background: mode === 'share' ? '#f1f5f9' : 'transparent',
            border: 'none',
            borderBottom: mode === 'share' ? '2px solid #0ea5e9' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: mode === 'share' ? 'bold' : 'normal',
            color: mode === 'share' ? '#0f172a' : '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Share2 size={16} />
            Share
          </div>
        </button>
      </div>
      
      {/* Content area */}
      <div style={{ 
        padding: '16px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {/* Preview */}
        <div style={{ 
          marginBottom: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          padding: '8px',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ 
            width: '100%',
            paddingBottom: `${(1 / aspectRatio) * 100}%`,
            position: 'relative',
            backgroundColor: '#e5e7eb'
          }}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Map Preview" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '2px'
                }}
              />
            ) : (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px'
              }}>
                Preview will appear here
              </div>
            )}
            
            {/* Paper size overlay */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '4px'
            }}>
              {options.paperSize === PaperSize.CUSTOM
                ? `Custom (${options.customWidth}″ × ${options.customHeight}″)`
                : PAPER_SIZES[options.paperSize].name
              }
              {` - ${options.orientation}`}
            </div>
          </div>
          
          <button
            onClick={generatePreview}
            style={{
              display: 'block',
              margin: '8px auto 0',
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Generate Preview
          </button>
        </div>
        
        {/* Setting tabs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('basic')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: activeTab === 'basic' ? '#e0f2fe' : '#f1f5f9',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
                color: activeTab === 'basic' ? '#0c4a6e' : '#64748b'
              }}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: activeTab === 'advanced' ? '#e0f2fe' : '#f1f5f9',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'advanced' ? 'bold' : 'normal',
                color: activeTab === 'advanced' ? '#0c4a6e' : '#64748b'
              }}
            >
              Advanced Settings
            </button>
          </div>
          
          {activeTab === 'basic' ? (
            /* Basic settings */
            <div>
              {/* Format selection for export mode */}
              {mode === 'export' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Export Format
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px'
                  }}>
                    {availableFormats.map(format => (
                      <button
                        key={format}
                        onClick={() => updateOption('format', format)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '12px 8px',
                          backgroundColor: options.format === format ? '#e0f2fe' : '#f8fafc',
                          border: options.format === format ? '1px solid #bae6fd' : '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ 
                          marginBottom: '6px',
                          color: options.format === format ? '#0c4a6e' : '#64748b'
                        }}>
                          {FORMAT_INFO[format].icon}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: options.format === format ? 'bold' : 'normal',
                          color: options.format === format ? '#0c4a6e' : '#0f172a'
                        }}>
                          {FORMAT_INFO[format].name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Paper size for print mode */}
              {mode === 'print' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Paper Size
                  </label>
                  <select
                    value={options.paperSize}
                    onChange={(e) => updateOption('paperSize', e.target.value as PaperSize)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  >
                    {Object.entries(PAPER_SIZES).map(([size, details]) => (
                      <option key={size} value={size}>
                        {details.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom size fields */}
                  {options.paperSize === PaperSize.CUSTOM && (
                    <div style={{ 
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                          Width (inches)
                        </label>
                        <input
                          type="number"
                          value={options.customWidth}
                          onChange={(e) => updateOption('customWidth', parseFloat(e.target.value))}
                          min="1"
                          max="100"
                          step="0.1"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                          Height (inches)
                        </label>
                        <input
                          type="number"
                          value={options.customHeight}
                          onChange={(e) => updateOption('customHeight', parseFloat(e.target.value))}
                          min="1"
                          max="100"
                          step="0.1"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Orientation for print mode */}
              {mode === 'print' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Orientation
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => updateOption('orientation', PrintOrientation.PORTRAIT)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: options.orientation === PrintOrientation.PORTRAIT ? '#e0f2fe' : '#f8fafc',
                        border: options.orientation === PrintOrientation.PORTRAIT ? '1px solid #bae6fd' : '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '20px', 
                        height: '28px', 
                        border: '1px solid currentColor',
                        borderRadius: '2px'
                      }} />
                      <span style={{ 
                        fontSize: '14px',
                        fontWeight: options.orientation === PrintOrientation.PORTRAIT ? 'bold' : 'normal'
                      }}>
                        Portrait
                      </span>
                    </button>
                    
                    <button
                      onClick={() => updateOption('orientation', PrintOrientation.LANDSCAPE)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: options.orientation === PrintOrientation.LANDSCAPE ? '#e0f2fe' : '#f8fafc',
                        border: options.orientation === PrintOrientation.LANDSCAPE ? '1px solid #bae6fd' : '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '28px', 
                        height: '20px', 
                        border: '1px solid currentColor',
                        borderRadius: '2px'
                      }} />
                      <span style={{ 
                        fontSize: '14px',
                        fontWeight: options.orientation === PrintOrientation.LANDSCAPE ? 'bold' : 'normal'
                      }}>
                        Landscape
                      </span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Quality selection for export mode */}
              {mode === 'export' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Quality
                  </label>
                  <div style={{ 
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {Object.entries(QUALITY_INFO).map(([quality, info]) => (
                      <button
                        key={quality}
                        onClick={() => updateOption('quality', quality as PrintQuality)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          backgroundColor: options.quality === quality ? '#e0f2fe' : '#f8fafc',
                          border: options.quality === quality ? '1px solid #bae6fd' : '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: options.quality === quality ? 'bold' : 'normal',
                          color: options.quality === quality ? '#0c4a6e' : '#0f172a'
                        }}>
                          {info.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '2px'
                        }}>
                          {info.dpi} DPI
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Title field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => updateOption('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px'
                  }}
                  placeholder="Enter map title"
                />
              </div>
              
              {/* Description field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={options.description}
                  onChange={(e) => updateOption('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    height: '60px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter map description"
                />
              </div>
            </div>
          ) : (
            /* Advanced settings */
            <div>
              {/* Map elements toggles */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                  Map Elements
                </label>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {/* Show legend */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '6px 8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={options.showLegend}
                      onChange={(e) => updateOption('showLegend', e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Show Legend</span>
                  </label>
                  
                  {/* Show scale */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '6px 8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={options.showScale}
                      onChange={(e) => updateOption('showScale', e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Show Scale</span>
                  </label>
                  
                  {/* Show north arrow */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '6px 8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={options.showNorth}
                      onChange={(e) => updateOption('showNorth', e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Show North Arrow</span>
                  </label>
                  
                  {/* Show attribution */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '6px 8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={options.showAttribution}
                      onChange={(e) => updateOption('showAttribution', e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Show Attribution</span>
                  </label>
                </div>
              </div>
              
              {/* Margin settings */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Include Margins
                  </label>
                  <label className="toggle-switch" style={{ 
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '22px'
                  }}>
                    <input
                      type="checkbox"
                      checked={options.includeMargin}
                      onChange={(e) => updateOption('includeMargin', e.target.checked)}
                      style={{ 
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{ 
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: options.includeMargin ? '#0ea5e9' : '#cbd5e1',
                      borderRadius: '34px',
                      transition: 'background-color 0.2s',
                      '&:before': {
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: options.includeMargin ? '22px' : '2px',
                        bottom: '2px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.2s'
                      }
                    }}>
                      <span style={{ 
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: options.includeMargin ? '22px' : '2px',
                        bottom: '2px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.2s'
                      }} />
                    </span>
                  </label>
                </div>
                
                {options.includeMargin && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      Margin Size: {options.marginSize} inches
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={options.marginSize}
                      onChange={(e) => updateOption('marginSize', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* DPI setting for export */}
              {mode === 'export' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Resolution (DPI)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="72"
                      max="600"
                      step="1"
                      value={options.dpi}
                      onChange={(e) => updateOption('dpi', parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '60px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                      {options.dpi} DPI
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: '#64748b',
                    marginTop: '4px'
                  }}>
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              )}
              
              {/* Location information */}
              {mapCenterCoordinates && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                    Map Center Coordinates
                  </label>
                  <div style={{ 
                    padding: '8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <div>Latitude: {mapCenterCoordinates.lat.toFixed(6)}</div>
                    <div>Longitude: {mapCenterCoordinates.lng.toFixed(6)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div>
          {/* Status message */}
          {error && (
            <div style={{ 
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          {isComplete && !error && (
            <div style={{ 
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} />
              {mode === 'print' ? 'Print job sent successfully!' : 
               mode === 'export' ? 'Export completed successfully!' : 
               'Map shared successfully!'}
            </div>
          )}
          
          {/* Share URL */}
          {mode === 'share' && shareUrl && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                Share URL
              </label>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#f1f5f9'
                  }}
                />
                <button
                  onClick={copyShareUrl}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Action button */}
          <button
            onClick={
              mode === 'print' ? handlePrint : 
              mode === 'export' ? handleExport : 
              handleShare
            }
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isProcessing ? '#94a3b8' : '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isProcessing ? 'default' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === 'print' ? 'Printing...' : 
                mode === 'export' ? 'Exporting...' : 
                'Sharing...'}
              </>
            ) : (
              <>
                {mode === 'print' ? (
                  <>
                    <Printer size={18} />
                    Print Map
                  </>
                ) : mode === 'export' ? (
                  <>
                    <Download size={18} />
                    Export Map
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    Share Map
                  </>
                )}
              </>
            )}
          </button>
          
          {/* Format info for export mode */}
          {mode === 'export' && options.format && (
            <div style={{ 
              marginTop: '12px', 
              fontSize: '13px', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Info size={14} />
              {FORMAT_INFO[options.format].description}
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden download link for export */}
      <a 
        ref={downloadLinkRef}
        style={{ display: 'none' }}
      />
      
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

// Helper function to get positioning style based on position prop
function getPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top-left':
      return { top: '10px', left: '10px' };
    case 'top-right':
      return { top: '10px', right: '10px' };
    case 'bottom-left':
      return { bottom: '10px', left: '10px' };
    case 'bottom-right':
      return { bottom: '10px', right: '10px' };
    default:
      return { top: '10px', right: '10px' };
  }
}