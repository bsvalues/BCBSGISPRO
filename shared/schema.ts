import { createInsertSchema } from 'drizzle-zod';
import { integer, json, pgEnum, pgTable, serial, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { DocumentType } from './document-types';

// Parcel table
export const parcels = pgTable('parcels', {
  id: serial('id').primaryKey(),
  parcelNumber: varchar('parcel_number', { length: 50 }).notNull().unique(),
  legalDescription: text('legal_description'),
  geometry: text('geometry'),
  owner: varchar('owner', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 100 }),
  zip: varchar('zip', { length: 20 }),
  propertyType: varchar('property_type', { length: 50 }),
  assessedValue: integer('assessed_value'),
  acres: integer('acres'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;
export const insertParcelSchema = createInsertSchema(parcels);

// Document table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  path: text('path').notNull(),
  size: integer('size').notNull(),
  parcelId: integer('parcel_id').references(() => parcels.id),
  uploadDate: timestamp('upload_date').defaultNow(),
  isArchived: boolean('is_archived').default(false)
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export const insertDocumentSchema = createInsertSchema(documents);

// Map annotations
export const annotations = pgTable('annotations', {
  id: serial('id').primaryKey(),
  parcelId: integer('parcel_id').references(() => parcels.id),
  type: varchar('type', { length: 50 }).notNull(),
  geometry: json('geometry').notNull(),
  properties: json('properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by')
});

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = typeof annotations.$inferInsert;
export const insertAnnotationSchema = createInsertSchema(annotations);

// Helper types
export interface ParsedLegalDescription {
  township: string;
  range: string;
  section: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}