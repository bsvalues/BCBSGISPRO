-- Create missing enums first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM (
          'plat_map',
          'deed',
          'survey',
          'legal_description',
          'boundary_line_adjustment',
          'tax_form',
          'unclassified'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_content_type') THEN
        CREATE TYPE document_content_type AS ENUM (
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/tiff',
          'text/plain',
          'application/vnd.ms-excel',
          'application/xlsx', -- Shortened from 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          'application/docx', -- Shortened from 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          'application/rtf'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'map_layer_type') THEN
        CREATE TYPE map_layer_type AS ENUM (
          'vector',
          'raster',
          'tile',
          'wms',
          'geojson'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'map_layer_source') THEN
        CREATE TYPE map_layer_source AS ENUM (
          'county',
          'state',
          'federal',
          'custom',
          'osm'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM (
          'pending',
          'processing',
          'completed',
          'failed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_schedule_frequency') THEN
        CREATE TYPE report_schedule_frequency AS ENUM (
          'daily',
          'weekly',
          'monthly',
          'quarterly'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_format') THEN
        CREATE TYPE report_format AS ENUM (
          'pdf',
          'excel',
          'csv',
          'html'
        );
    END IF;
END
$$;

-- Create missing tables
-- Document-Parcel Links
CREATE TABLE IF NOT EXISTS document_parcel_links (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parcel_id INTEGER NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS document_parcel_links_document_id_idx ON document_parcel_links(document_id);
CREATE INDEX IF NOT EXISTS document_parcel_links_parcel_id_idx ON document_parcel_links(parcel_id);
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON document_versions(document_id);