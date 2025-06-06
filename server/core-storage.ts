import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, parcels, documents, mapLayers, auditLogs, type User, type Parcel, type Document, type MapLayer, type AuditLog, type InsertUser, type InsertParcel, type InsertDocument, type InsertMapLayer } from '../shared/core-schema'
import { eq, desc, and, or, like } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

export interface ICoreStorage {
  users: {
    create(data: InsertUser): Promise<User>
    getById(id: string): Promise<User | undefined>
    getByEmail(email: string): Promise<User | undefined>
    update(id: string, data: Partial<InsertUser>): Promise<User | undefined>
    list(): Promise<User[]>
  }
  counties: {
    create(data: InsertCounty): Promise<County>
    getById(id: string): Promise<County | undefined>
    getByFipsCode(fipsCode: string): Promise<County | undefined>
    update(id: string, data: Partial<InsertCounty>): Promise<County | undefined>
    list(): Promise<County[]>
    updateParcelCount(id: string, count: number): Promise<void>
  }
  parcels: {
    create(data: InsertParcel): Promise<Parcel>
    getById(id: string): Promise<Parcel | undefined>
    getByParcelNumber(parcelNumber: string): Promise<Parcel | undefined>
    getByCounty(countyId: string, limit?: number): Promise<Parcel[]>
    update(id: string, data: Partial<InsertParcel>): Promise<Parcel | undefined>
    search(query: string, countyId?: string): Promise<Parcel[]>
    list(limit?: number): Promise<Parcel[]>
    bulkImport(parcels: InsertParcel[]): Promise<Parcel[]>
  }
  documents: {
    create(data: InsertDocument): Promise<Document>
    getById(id: string): Promise<Document | undefined>
    getByParcelId(parcelId: string): Promise<Document[]>
    update(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>
    list(limit?: number): Promise<Document[]>
    processAI(id: string): Promise<Document | undefined>
  }
  gisLayers: {
    create(data: InsertGisLayer): Promise<GisLayer>
    getById(id: string): Promise<GisLayer | undefined>
    getByCounty(countyId: string): Promise<GisLayer[]>
    update(id: string, data: Partial<InsertGisLayer>): Promise<GisLayer | undefined>
    list(): Promise<GisLayer[]>
    delete(id: string): Promise<boolean>
  }
  workflows: {
    create(data: InsertWorkflow): Promise<Workflow>
    getById(id: string): Promise<Workflow | undefined>
    update(id: string, data: Partial<InsertWorkflow>): Promise<Workflow | undefined>
    list(): Promise<Workflow[]>
    execute(id: string): Promise<any>
  }
  mapLayers: {
    create(data: InsertMapLayer): Promise<MapLayer>
    getById(id: string): Promise<MapLayer | undefined>
    update(id: string, data: Partial<InsertMapLayer>): Promise<MapLayer | undefined>
    list(): Promise<MapLayer[]>
    delete(id: string): Promise<boolean>
  }
  auditLogs: {
    log(action: string, entityType: string, entityId: string, userId: string, changes?: any, ipAddress?: string): Promise<void>
    getByEntity(entityType: string, entityId: string): Promise<AuditLog[]>
    getByUser(userId: string): Promise<AuditLog[]>
  }
}

export class PostgresStorage implements ICoreStorage {
  counties = {
    async create(data: InsertCounty): Promise<County> {
      const id = crypto.randomUUID()
      const [county] = await db.insert(counties).values({ ...data, id }).returning()
      return county
    },

    async getById(id: string): Promise<County | undefined> {
      const [county] = await db.select().from(counties).where(eq(counties.id, id))
      return county
    },

    async getByFipsCode(fipsCode: string): Promise<County | undefined> {
      const [county] = await db.select().from(counties).where(eq(counties.fipsCode, fipsCode))
      return county
    },

    async update(id: string, data: Partial<InsertCounty>): Promise<County | undefined> {
      const [county] = await db.update(counties).set(data).where(eq(counties.id, id)).returning()
      return county
    },

    async list(): Promise<County[]> {
      return await db.select().from(counties).orderBy(counties.name)
    },

    async updateParcelCount(id: string, count: number): Promise<void> {
      await db.update(counties).set({ totalParcels: count }).where(eq(counties.id, id))
    }
  }

  users = {
    async create(data: InsertUser): Promise<User> {
      const id = uuidv4()
      const [user] = await db.insert(users).values({ ...data, id }).returning()
      return user
    },

    async getById(id: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.id, id))
      return user
    },

    async getByEmail(email: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.email, email))
      return user
    },

    async update(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
      const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning()
      return user
    },

    async list(): Promise<User[]> {
      return await db.select().from(users).where(eq(users.isActive, true))
    }
  }

  parcels = {
    async create(data: InsertParcel): Promise<Parcel> {
      const id = uuidv4()
      const [parcel] = await db.insert(parcels).values({ ...data, id }).returning()
      return parcel
    },

    async getById(id: string): Promise<Parcel | undefined> {
      const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id))
      return parcel
    },

    async getByParcelNumber(parcelNumber: string): Promise<Parcel | undefined> {
      const [parcel] = await db.select().from(parcels).where(eq(parcels.parcelNumber, parcelNumber))
      return parcel
    },

    async update(id: string, data: Partial<InsertParcel>): Promise<Parcel | undefined> {
      const [parcel] = await db.update(parcels).set({ ...data, lastModified: new Date() }).where(eq(parcels.id, id)).returning()
      return parcel
    },

    async search(query: string): Promise<Parcel[]> {
      return await db.select().from(parcels).where(
        or(
          like(parcels.parcelNumber, `%${query}%`),
          like(parcels.address, `%${query}%`),
          like(parcels.ownerName, `%${query}%`)
        )
      )
    },

    async list(limit = 100): Promise<Parcel[]> {
      return await db.select().from(parcels).limit(limit).orderBy(desc(parcels.lastModified))
    }
  }

  documents = {
    async create(data: InsertDocument): Promise<Document> {
      const id = uuidv4()
      const [document] = await db.insert(documents).values({ ...data, id }).returning()
      return document
    },

    async getById(id: string): Promise<Document | undefined> {
      const [document] = await db.select().from(documents).where(eq(documents.id, id))
      return document
    },

    async getByParcelId(parcelId: string): Promise<Document[]> {
      return await db.select().from(documents).where(eq(documents.parcelId, parcelId))
    },

    async update(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
      const [document] = await db.update(documents).set(data).where(eq(documents.id, id)).returning()
      return document
    },

    async list(limit = 50): Promise<Document[]> {
      return await db.select().from(documents).limit(limit).orderBy(desc(documents.uploadedAt))
    }
  }

  mapLayers = {
    async create(data: InsertMapLayer): Promise<MapLayer> {
      const id = uuidv4()
      const [layer] = await db.insert(mapLayers).values({ ...data, id }).returning()
      return layer
    },

    async getById(id: string): Promise<MapLayer | undefined> {
      const [layer] = await db.select().from(mapLayers).where(eq(mapLayers.id, id))
      return layer
    },

    async update(id: string, data: Partial<InsertMapLayer>): Promise<MapLayer | undefined> {
      const [layer] = await db.update(mapLayers).set(data).where(eq(mapLayers.id, id)).returning()
      return layer
    },

    async list(): Promise<MapLayer[]> {
      return await db.select().from(mapLayers).orderBy(mapLayers.ordering)
    },

    async delete(id: string): Promise<boolean> {
      try {
        await db.delete(mapLayers).where(eq(mapLayers.id, id))
        return true
      } catch {
        return false
      }
    }
  }

  auditLogs = {
    async log(action: string, entityType: string, entityId: string, userId: string, changes?: any, ipAddress?: string): Promise<void> {
      const id = uuidv4()
      await db.insert(auditLogs).values({
        id,
        action,
        entityType,
        entityId,
        userId,
        changes,
        ipAddress
      })
    },

    async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
      return await db.select().from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(desc(auditLogs.timestamp))
    },

    async getByUser(userId: string): Promise<AuditLog[]> {
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.timestamp))
    }
  }
}

export const storage = new PostgresStorage()