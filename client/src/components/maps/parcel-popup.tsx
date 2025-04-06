import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Parcel } from '@shared/schema';
import { GeoJSONFeature, formatArea, squareMetersToAcres } from '@/lib/map-utils';
import { 
  MapPin, 
  ExternalLink, 
  Clipboard, 
  Home, 
  MapPinned, 
  Box, 
  X, 
  Star, 
  Maximize,
  Building,
  Landmark,
  Building2
} from 'lucide-react';
import * as turf from '@turf/turf';

type ParcelPopupProps = {
  parcel: Parcel;
  feature: GeoJSONFeature;
  onClose?: () => void;
  onViewDetails?: (parcelId: string | number) => void;
  onSelectParcel?: (parcelId: string | number) => void;
  className?: string;
  isMapPopup?: boolean;
  position?: [number, number]; // Latitude, longitude
};

/**
 * Premium parcel information display with sophisticated glass-morphism 
 * visuals, elegant typography, and cinematic interaction patterns
 */
export function ParcelPopup({
  parcel,
  feature,
  onClose,
  onViewDetails,
  onSelectParcel,
  className = '',
  isMapPopup = false,
  position,
}: ParcelPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Calculate the area of the parcel from the feature if available
  const parcelArea = feature?.geometry?.type && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)
    ? turf.area(feature)
    : parcel.acres ? parseFloat(parcel.acres) * 4046.86 : 0; // Convert acres to square meters if needed
  
  // Format area in appropriate units
  const formattedArea = parcelArea ? formatArea(parcelArea) : '';
  const formattedAcres = parcelArea ? squareMetersToAcres(parcelArea).toFixed(2) : '';
  
  // Format the parcel number with proper spacing
  const formattedParcelNumber = parcel.parcelNumber?.toString().replace(/(\d{2})(\d{2})(\d{2})(\d{4})(\d{5})/, '$1-$2-$3-$4-$5') || '';
  
  // Close popup when clicking outside (if it's a map popup)
  useEffect(() => {
    if (isMapPopup && popupRef.current) {
      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          if (onClose) onClose();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMapPopup, onClose]);

  // Determine icon based on any available zoning information
  const getZoningIcon = () => {
    const zoningText = (parcel.zoning || '').toLowerCase();
    
    if (zoningText.includes('resident') || zoningText.includes('housing')) {
      return <Home className="h-4 w-4" />;
    } else if (zoningText.includes('commerc') || zoningText.includes('business')) {
      return <Building className="h-4 w-4" />;
    } else if (zoningText.includes('industr')) {
      return <Building2 className="h-4 w-4" />;
    } else if (zoningText.includes('public') || zoningText.includes('government')) {
      return <Landmark className="h-4 w-4" />;
    }
    
    return <Landmark className="h-4 w-4" />;
  };

  // Conditionally apply classes for map popup vs regular component
  const containerClasses = `${isMapPopup ? 'z-[1000] premium-glass' : ''} ${className} ${expanded ? 'w-80' : 'max-w-xs'}`;

  return (
    <Card 
      className={containerClasses} 
      ref={popupRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.35) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: isMapPopup ? '0 20px 40px rgba(0, 0, 0, 0.18), 0 8px 20px rgba(0, 0, 0, 0.12)' : undefined,
        transform: 'translateZ(1px)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Subtle glow effect on hover */}
      {hovering && (
        <div 
          className="absolute inset-0 -z-10 opacity-40 rounded-lg pointer-events-none" 
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(15px)'
          }}
        />
      )}
      
      {/* Header with elegant styling */}
      <CardHeader className="pb-2.5 border-b border-white/30">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-2 readable-text font-semibold">
              <div className="bg-primary/15 p-1.5 rounded-full flex items-center justify-center drop-shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-primary-700" />
              </div>
              <span className="text-primary-900">Parcel {parcel.id || parcel.parcelNumber}</span>
            </CardTitle>
            <CardDescription className="readable-text font-medium text-neutral-700 mt-0.5 line-clamp-1">
              {parcel.owner || 'Unknown Owner'}
            </CardDescription>
          </div>
          
          <div className="flex gap-1">
            {/* Expand/collapse button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-black/5 btn-3d rounded-full"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <Maximize className="h-3.5 w-3.5 text-primary-600" />
            </Button>
            
            {/* Close button */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500 btn-3d rounded-full"
                onClick={onClose}
                aria-label="Close popup"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Content with subtle animations */}
      <CardContent className="py-3.5 pb-2">
        <div className="space-y-3 text-sm readable-text" style={{ transition: 'all 0.3s ease-out' }}>
          {parcel.address && (
            <div className="flex items-start gap-2.5 hover:translate-x-0.5 transition-transform">
              <div className="bg-amber-50 p-1.5 rounded-full drop-shadow-sm flex items-center justify-center">
                <Home className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="pt-0.5">
                <div className="text-xs text-neutral-500 font-medium">Address</div>
                <div className="text-neutral-800">{parcel.address}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2.5 hover:translate-x-0.5 transition-transform">
            <div className="bg-blue-50 p-1.5 rounded-full drop-shadow-sm flex items-center justify-center">
              <MapPinned className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="pt-0.5">
              <div className="text-xs text-neutral-500 font-medium">Parcel ID</div>
              <div className="text-neutral-800 font-medium tracking-wide">{formattedParcelNumber}</div>
            </div>
          </div>
          
          {(formattedAcres || formattedArea) && (
            <div className="flex items-start gap-2.5 hover:translate-x-0.5 transition-transform">
              <div className="bg-green-50 p-1.5 rounded-full drop-shadow-sm flex items-center justify-center">
                <Box className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div className="pt-0.5">
                <div className="text-xs text-neutral-500 font-medium">Area</div>
                <div className="text-neutral-800">
                  {formattedAcres && <span className="font-medium">{formattedAcres} acres</span>}
                  {formattedAcres && formattedArea && <span className="mx-1 text-neutral-400">•</span>}
                  {formattedArea && <span className="text-neutral-500">{formattedArea}</span>}
                </div>
              </div>
            </div>
          )}
          
          {parcel.zoning && (
            <div className="flex items-start gap-2.5 hover:translate-x-0.5 transition-transform">
              <div className="bg-purple-50 p-1.5 rounded-full drop-shadow-sm flex items-center justify-center">
                {getZoningIcon()}
              </div>
              <div className="pt-0.5">
                <div className="text-xs text-neutral-500 font-medium">Zoning</div>
                <div className="flex mt-0.5">
                  <Badge 
                    variant="outline" 
                    className="bg-white/60 border-primary/20 text-primary-700 font-medium px-2.5 py-0.5"
                  >
                    {parcel.zoning}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Footer with action buttons */}
      {(onViewDetails || onSelectParcel) && (
        <>
          <Separator className="bg-white/40" />
          <CardFooter className="pt-2.5 pb-3 flex gap-2 justify-end">
            {onSelectParcel && (
              <Button 
                variant="outline"
                size="sm"
                className="btn-3d bg-white/60 hover:bg-white/90 border-white/30 text-neutral-700 h-8"
                onClick={() => onSelectParcel(parcel.id || parcel.parcelNumber!)}
              >
                <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                <span>Select</span>
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                variant="default"
                size="sm"
                className="btn-3d h-8 bg-primary/90 hover:bg-primary/100"
                onClick={() => onViewDetails(parcel.id || parcel.parcelNumber!)}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                <span>Details</span>
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default ParcelPopup;