import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, Search, FileText, Settings } from 'lucide-react'

interface TerraFusionMapProps {
  onParcelSelect?: (parcel: any) => void
  selectedParcelId?: string
}

export default function TerraFusionMap({ onParcelSelect, selectedParcelId }: TerraFusionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapLayers, setMapLayers] = useState([])

  useEffect(() => {
    const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN
    
    if (!mapboxToken) {
      console.warn('Mapbox token not configured')
      return
    }

    if (map.current) return

    mapboxgl.accessToken = mapboxToken
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-119.2687, 46.2619],
      zoom: 11,
      projection: 'mercator'
    })

    map.current.on('load', () => {
      setIsLoaded(true)
      loadBentonCountyBoundary()
      loadParcelData()
    })

    map.current.on('click', 'parcels', (e) => {
      if (e.features && e.features[0] && onParcelSelect) {
        onParcelSelect(e.features[0].properties)
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  const loadBentonCountyBoundary = () => {
    if (!map.current) return

    map.current.addSource('benton-boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.8, 45.9], [-119.8, 46.6], [-119.0, 46.6], [-119.0, 45.9], [-119.8, 45.9]
          ]]
        }
      }
    })

    map.current.addLayer({
      id: 'benton-boundary',
      type: 'line',
      source: 'benton-boundary',
      paint: {
        'line-color': '#FF6B35',
        'line-width': 3,
        'line-opacity': 0.8
      }
    })
  }

  const loadParcelData = async () => {
    if (!map.current) return

    try {
      const response = await fetch('/api/parcels?limit=100')
      const parcels = await response.json()

      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: parcels.map((parcel: any) => ({
          type: 'Feature' as const,
          properties: parcel,
          geometry: parcel.geometry || {
            type: 'Point',
            coordinates: [-119.2687 + (Math.random() - 0.5) * 0.1, 46.2619 + (Math.random() - 0.5) * 0.1]
          }
        }))
      }

      map.current.addSource('parcels', {
        type: 'geojson',
        data: geojsonData
      })

      map.current.addLayer({
        id: 'parcels',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': 0.3,
          'fill-outline-color': '#2E5BBA'
        }
      })

      map.current.addLayer({
        id: 'parcel-labels',
        type: 'symbol',
        source: 'parcels',
        layout: {
          'text-field': ['get', 'parcelNumber'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      })
    } catch (error) {
      console.error('Failed to load parcel data:', error)
    }
  }

  const toggleLayer = (layerId: string) => {
    if (!map.current) return
    
    const visibility = map.current.getLayoutProperty(layerId, 'visibility')
    map.current.setLayoutProperty(
      layerId,
      'visibility',
      visibility === 'visible' ? 'none' : 'visible'
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      <Card className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers size={16} />
            TerraFusion Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => toggleLayer('parcels')}
          >
            <FileText size={14} className="mr-2" />
            Toggle Parcels
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => toggleLayer('benton-boundary')}
          >
            <Search size={14} className="mr-2" />
            County Boundary
          </Button>
        </CardContent>
      </Card>

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading TerraFusion Map...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}