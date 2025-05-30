import express from 'express'
import multer from 'multer'
import { storage } from './core-storage'
import { insertUserSchema, insertParcelSchema, insertDocumentSchema, insertMapLayerSchema } from '../shared/core-schema'
import { analyzeDocument } from './ai-service'
import { z } from 'zod'

const router = express.Router()

router.get('/users', async (req, res) => {
  try {
    const users = await storage.users.list()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.post('/users', async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body)
    const user = await storage.users.create(data)
    res.status(201).json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create user' })
    }
  }
})

router.get('/parcels', async (req, res) => {
  try {
    const { search, limit } = req.query
    let parcels
    
    if (search) {
      parcels = await storage.parcels.search(search as string)
    } else {
      parcels = await storage.parcels.list(limit ? parseInt(limit as string) : undefined)
    }
    
    res.json(parcels)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parcels' })
  }
})

router.post('/parcels', async (req, res) => {
  try {
    const data = insertParcelSchema.parse(req.body)
    const parcel = await storage.parcels.create(data)
    
    if (req.body.userId) {
      await storage.auditLogs.log('CREATE', 'parcel', parcel.id, req.body.userId, data, req.ip)
    }
    
    res.status(201).json(parcel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create parcel' })
    }
  }
})

router.get('/parcels/:id', async (req, res) => {
  try {
    const parcel = await storage.parcels.getById(req.params.id)
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }
    res.json(parcel)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parcel' })
  }
})

router.put('/parcels/:id', async (req, res) => {
  try {
    const data = insertParcelSchema.partial().parse(req.body)
    const parcel = await storage.parcels.update(req.params.id, data)
    
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }
    
    if (req.body.userId) {
      await storage.auditLogs.log('UPDATE', 'parcel', parcel.id, req.body.userId, data, req.ip)
    }
    
    res.json(parcel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to update parcel' })
    }
  }
})

router.get('/documents', async (req, res) => {
  try {
    const { parcelId, limit } = req.query
    let documents
    
    if (parcelId) {
      documents = await storage.documents.getByParcelId(parcelId as string)
    } else {
      documents = await storage.documents.list(limit ? parseInt(limit as string) : undefined)
    }
    
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/documents', async (req, res) => {
  try {
    const data = insertDocumentSchema.parse(req.body)
    const document = await storage.documents.create(data)
    
    if (req.body.uploadedBy) {
      await storage.auditLogs.log('CREATE', 'document', document.id, req.body.uploadedBy, data, req.ip)
    }
    
    res.status(201).json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create document' })
    }
  }
})

router.get('/map-layers', async (req, res) => {
  try {
    const layers = await storage.mapLayers.list()
    res.json(layers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch map layers' })
  }
})

router.post('/map-layers', async (req, res) => {
  try {
    const data = insertMapLayerSchema.parse(req.body)
    const layer = await storage.mapLayers.create(data)
    
    if (req.body.createdBy) {
      await storage.auditLogs.log('CREATE', 'map_layer', layer.id, req.body.createdBy, data, req.ip)
    }
    
    res.status(201).json(layer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create map layer' })
    }
  }
})

router.put('/map-layers/:id', async (req, res) => {
  try {
    const data = insertMapLayerSchema.partial().parse(req.body)
    const layer = await storage.mapLayers.update(req.params.id, data)
    
    if (!layer) {
      return res.status(404).json({ error: 'Map layer not found' })
    }
    
    res.json(layer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to update map layer' })
    }
  }
})

router.delete('/map-layers/:id', async (req, res) => {
  try {
    const success = await storage.mapLayers.delete(req.params.id)
    
    if (!success) {
      return res.status(404).json({ error: 'Map layer not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete map layer' })
  }
})

router.get('/audit-logs/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    const logs = await storage.auditLogs.getByEntity(entityType, entityId)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

export default router