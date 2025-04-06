import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Parcel } from '@shared/schema';
import { GeoJSONFeature, formatArea, squareMetersToAcres } from '@/lib/map-utils';
import { MapPin, ExternalLink, Clipboard, Home, MapPinned, Box } from 'lucide-react';
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
 * Component that displays parcel information in a popup
 * Can be used either as a tooltip on the map or as a standalone component
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

  // Conditionally apply classes for map popup vs regular component
  const containerClasses = `${isMapPopup ? 'z-[1000] max-w-xs map-card' : ''} ${className}`;

  return (
    <Card 
      className={containerClasses} 
      ref={popupRef}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
        boxShadow: isMapPopup ? '0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)' : undefined
      }}
    >
      <CardHeader className="pb-2 border-b border-white/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-1.5 readable-text">
              <div className="bg-primary/15 p-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-primary-700" />
              </div>
              Parcel {parcel.id || parcel.parcelNumber}
            </CardTitle>
            <CardDescription className="readable-text font-medium text-neutral-600">
              {parcel.owner || 'Unknown Owner'}
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 btn-3d rounded-full"
              onClick={onClose}
              aria-label="Close popup"
            >
              &times;
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="py-3 pb-2">
        <div className="space-y-2.5 text-sm readable-text">
          {parcel.address && (
            <div className="flex items-start gap-2">
              <div className="bg-amber-50 p-1 rounded-full">
                <Home className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-neutral-700">{parcel.address}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <div className="bg-blue-50 p-1 rounded-full">
              <MapPinned className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-neutral-700 font-medium">{formattedParcelNumber}</span>
          </div>
          
          {(formattedAcres || formattedArea) && (
            <div className="flex items-start gap-2">
              <div className="bg-green-50 p-1 rounded-full">
                <Box className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="text-neutral-700">
                {formattedAcres && <span className="font-medium">{formattedAcres}</span>}
                {formattedAcres && " acres"}
                {formattedAcres && formattedArea && ' / '}
                {formattedArea}
              </span>
            </div>
          )}
          
          {parcel.zoning && (
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="outline" className="bg-white/50 border-primary/20 text-primary-800 font-medium">
                {parcel.zoning}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      {(onViewDetails || onSelectParcel) && (
        <>
          <Separator className="bg-white/20" />
          <CardFooter className="pt-2 pb-3 flex gap-2 justify-end">
            {onSelectParcel && (
              <Button 
                variant="outline"
                size="sm"
                className="btn-3d bg-white/50 hover:bg-white/80 border-white/30 text-neutral-700"
                onClick={() => onSelectParcel(parcel.id || parcel.parcelNumber!)}
              >
                <Clipboard className="h-3.5 w-3.5 mr-1" />
                Select
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                variant="default"
                size="sm"
                className="btn-3d"
                onClick={() => onViewDetails(parcel.id || parcel.parcelNumber!)}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Details
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default ParcelPopup;