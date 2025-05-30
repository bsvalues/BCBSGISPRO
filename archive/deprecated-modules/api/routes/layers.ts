/**
 * Layers API Routes
 * 
 * This module implements the API routes for map layer-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock data store - will be replaced with database in future
const layers = [
  {
    id: 'layer-1',
    countyId: 'benton-county',
    name: 'Parcels',
    type: 'vector',
    description: 'Benton County property parcels',
    source: {
      type: 'geojson',
      url: '/api/counties/benton-county/parcels/geojson',
      attribution: 'Benton County Assessor\'s Office'
    },
    style: {
      color: '#0066CC',
      fillColor: '#99CCFF',
      fillOpacity: 0.4,
      weight: 1,
      opacity: 0.8
    },
    visibility: {
      visible: true,
      minZoom: 10,
      maxZoom: 22
    },
    metadata: {
      dateCreated: '2023-01-15',
      dateUpdated: '2023-10-20',
      source: 'Benton County GIS',
      tags: ['parcels', 'property', 'boundaries']
    },
    order: 1,
    active: true,
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-10-20').toISOString()
  },
  {
    id: 'layer-2',
    countyId: 'benton-county',
    name: 'Zoning',
    type: 'vector',
    description: 'Benton County zoning districts',
    source: {
      type: 'geojson',
      url: '/api/counties/benton-county/zoning/geojson',
      attribution: 'Benton County Planning Department'
    },
    style: {
      color: '#006600',
      fillColor: '#99FF99',
      fillOpacity: 0.3,
      weight: 1.5,
      opacity: 0.7,
      dashArray: '5,5'
    },
    visibility: {
      visible: true,
      minZoom: 12,
      maxZoom: 22
    },
    metadata: {
      dateCreated: '2023-02-10',
      dateUpdated: '2023-09-15',
      source: 'Benton County Planning',
      tags: ['zoning', 'planning', 'land-use']
    },
    order: 2,
    active: true,
    createdAt: new Date('2023-02-10').toISOString(),
    updatedAt: new Date('2023-09-15').toISOString()
  },
  {
    id: 'layer-3',
    countyId: 'benton-county',
    name: 'Aerial Imagery',
    type: 'raster',
    description: 'High-resolution aerial imagery of Benton County (2023)',
    source: {
      type: 'tile',
      url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community'
    },
    style: {
      opacity: 0.8
    },
    visibility: {
      visible: false,
      minZoom: 10,
      maxZoom: 22
    },
    metadata: {
      dateCreated: '2023-03-20',
      dateUpdated: '2023-08-01',
      source: 'ESRI World Imagery',
      tags: ['aerial', 'imagery', 'satellite']
    },
    order: 3,
    active: true,
    createdAt: new Date('2023-03-20').toISOString(),
    updatedAt: new Date('2023-08-01').toISOString()
  },
  {
    id: 'layer-4',
    countyId: 'yakima-county',
    name: 'Parcels',
    type: 'vector',
    description: 'Yakima County property parcels',
    source: {
      type: 'geojson',
      url: '/api/counties/yakima-county/parcels/geojson',
      attribution: 'Yakima County Assessor\'s Office'
    },
    style: {
      color: '#663300',
      fillColor: '#CC9966',
      fillOpacity: 0.4,
      weight: 1,
      opacity: 0.8
    },
    visibility: {
      visible: true,
      minZoom: 10,
      maxZoom: 22
    },
    metadata: {
      dateCreated: '2023-02-05',
      dateUpdated: '2023-09-10',
      source: 'Yakima County GIS',
      tags: ['parcels', 'property', 'boundaries']
    },
    order: 1,
    active: true,
    createdAt: new Date('2023-02-05').toISOString(),
    updatedAt: new Date('2023-09-10').toISOString()
  }
];

// GET all layers with filtering
router.get('/', (req, res) => {
  const {
    countyId,
    type,
    visible,
    search,
    active
  } = req.query;
  
  let filteredLayers = [...layers];
  
  // Apply filters
  if (countyId) {
    filteredLayers = filteredLayers.filter(layer => layer.countyId === countyId);
  }
  
  if (type) {
    filteredLayers = filteredLayers.filter(layer => layer.type === type);
  }
  
  if (visible !== undefined) {
    const isVisible = visible === 'true';
    filteredLayers = filteredLayers.filter(layer => layer.visibility.visible === isVisible);
  }
  
  if (search) {
    const searchTerm = String(search).toLowerCase();
    filteredLayers = filteredLayers.filter(layer => 
      layer.name.toLowerCase().includes(searchTerm) ||
      (layer.description && layer.description.toLowerCase().includes(searchTerm)) ||
      (layer.metadata.tags && layer.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }
  
  if (active !== undefined) {
    const isActive = active === 'true';
    filteredLayers = filteredLayers.filter(layer => layer.active === isActive);
  }
  
  // Sort by order
  filteredLayers.sort((a, b) => a.order - b.order);
  
  // Apply pagination
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  
  const paginatedLayers = filteredLayers.slice(offset, offset + limit);
  
  res.json({
    success: true,
    data: paginatedLayers,
    meta: {
      total: filteredLayers.length,
      limit,
      offset
    }
  });
});

// GET specific layer by ID
router.get('/:id', (req, res) => {
  const layer = layers.find(l => l.id === req.params.id);
  
  if (!layer) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  res.json({
    success: true,
    data: layer
  });
});

// POST create a new layer
router.post('/', (req, res) => {
  const newLayer = {
    id: req.body.id || `layer-${uuidv4().substring(0, 8)}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: req.body.active !== undefined ? req.body.active : true
  };
  
  // Ensure required fields
  if (!newLayer.countyId || !newLayer.name || !newLayer.type || !newLayer.source) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'countyId, name, type, and source are required'
      }
    });
  }
  
  // Set default order if not provided
  if (!newLayer.order) {
    const countyLayers = layers.filter(l => l.countyId === newLayer.countyId);
    newLayer.order = countyLayers.length > 0 
      ? Math.max(...countyLayers.map(l => l.order)) + 1 
      : 1;
  }
  
  // Set default visibility if not provided
  if (!newLayer.visibility) {
    newLayer.visibility = {
      visible: true
    };
  }
  
  layers.push(newLayer);
  
  res.status(201).json({
    success: true,
    data: newLayer
  });
});

// PATCH update a layer
router.patch('/:id', (req, res) => {
  const layerIndex = layers.findIndex(l => l.id === req.params.id);
  
  if (layerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update layer with request body data
  layers[layerIndex] = {
    ...layers[layerIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: layers[layerIndex]
  });
});

// DELETE a layer
router.delete('/:id', (req, res) => {
  const layerIndex = layers.findIndex(l => l.id === req.params.id);
  
  if (layerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  layers.splice(layerIndex, 1);
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST update layer order
router.post('/counties/:countyId/order', (req, res) => {
  const { layerIds } = req.body;
  
  if (!layerIds || !Array.isArray(layerIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request body must include a layerIds array'
      }
    });
  }
  
  // Get county layers
  const countyLayers = layers.filter(l => l.countyId === req.params.countyId);
  
  // Verify all layer IDs exist for the county
  const validLayerIds = new Set(countyLayers.map(l => l.id));
  const allLayersExist = layerIds.every(id => validLayerIds.has(id));
  
  if (!allLayersExist) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_LAYER_IDS',
        message: 'One or more layer IDs do not exist for this county'
      }
    });
  }
  
  // Update order
  layerIds.forEach((id, index) => {
    const layerIndex = layers.findIndex(l => l.id === id);
    if (layerIndex !== -1) {
      layers[layerIndex].order = index + 1;
      layers[layerIndex].updatedAt = new Date().toISOString();
    }
  });
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// PATCH toggle layer visibility
router.patch('/:id/visibility', (req, res) => {
  const layerIndex = layers.findIndex(l => l.id === req.params.id);
  
  if (layerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update visibility
  layers[layerIndex].visibility = {
    ...layers[layerIndex].visibility,
    visible: req.body.visible !== undefined ? req.body.visible : !layers[layerIndex].visibility.visible
  };
  
  layers[layerIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: layers[layerIndex]
  });
});

// PATCH update layer style
router.patch('/:id/style', (req, res) => {
  const layerIndex = layers.findIndex(l => l.id === req.params.id);
  
  if (layerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  // Update style
  layers[layerIndex].style = {
    ...layers[layerIndex].style,
    ...req.body.style
  };
  
  layers[layerIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: layers[layerIndex]
  });
});

// GET layer feature count
router.get('/:id/features/count', (req, res) => {
  const layer = layers.find(l => l.id === req.params.id);
  
  if (!layer) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  // Mock feature count - would be calculated from actual features in real app
  const featureCount = {
    count: layer.id === 'layer-1' ? 65430 : 
           layer.id === 'layer-2' ? 156 : 
           layer.id === 'layer-4' ? 89750 : 0
  };
  
  res.json({
    success: true,
    data: featureCount
  });
});

// GET layer features (paginated)
router.get('/:id/features', (req, res) => {
  const layer = layers.find(l => l.id === req.params.id);
  
  if (!layer) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LAYER_NOT_FOUND',
        message: `Layer with ID ${req.params.id} not found`
      }
    });
  }
  
  // Mock features - would come from database or GIS service in real app
  const features = [];
  const totalFeatures = layer.id === 'layer-1' ? 65430 : 
                       layer.id === 'layer-2' ? 156 : 
                       layer.id === 'layer-4' ? 89750 : 0;
  
  // Generate some mock GeoJSON features for testing
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const numFeatures = Math.min(limit, 10); // Cap at 10 for mock data
  
  for (let i = 0; i < numFeatures; i++) {
    if (layer.type === 'vector') {
      // Generate random polygon for vector layers
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.2 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
            [-119.2 + Math.random() * 0.1, 46.21 + Math.random() * 0.1],
            [-119.21 + Math.random() * 0.1, 46.21 + Math.random() * 0.1],
            [-119.21 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
            [-119.2 + Math.random() * 0.1, 46.2 + Math.random() * 0.1]
          ]]
        },
        properties: {
          id: `feature-${i + 1}`,
          name: `Feature ${i + 1}`,
          description: `Description for feature ${i + 1}`
        }
      });
    }
  }
  
  res.json({
    success: true,
    data: {
      features,
      total: totalFeatures
    }
  });
});

export default router;