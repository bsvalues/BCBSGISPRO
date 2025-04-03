-- SQL Script to fix missing tables or inconsistencies in the database schema

-- Check and create users table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    END IF;
END $$;

-- Check and create sessions table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        CREATE TABLE sessions (
            sid VARCHAR(255) NOT NULL PRIMARY KEY,
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL
        );
        CREATE INDEX idx_sessions_expire ON sessions (expire);
        RAISE NOTICE 'Created sessions table';
    END IF;
END $$;

-- Check and create workflows table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
        CREATE TABLE workflows (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            description TEXT,
            user_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        RAISE NOTICE 'Created workflows table';
    END IF;
END $$;

-- Check and create workflow_states table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_states') THEN
        CREATE TABLE workflow_states (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL,
            current_step VARCHAR(100),
            progress INTEGER DEFAULT 0,
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        );
        RAISE NOTICE 'Created workflow_states table';
    END IF;
END $$;

-- Check and create checklist_items table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_items') THEN
        CREATE TABLE checklist_items (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        );
        RAISE NOTICE 'Created checklist_items table';
    END IF;
END $$;

-- Check and create documents table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
        CREATE TABLE documents (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            storage_key VARCHAR(255) NOT NULL,
            content_hash VARCHAR(255) NOT NULL,
            document_type VARCHAR(100),
            classification_confidence NUMERIC(5,4),
            was_manually_classified BOOLEAN DEFAULT FALSE,
            classified_at TIMESTAMP WITH TIME ZONE,
            content TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
        );
        RAISE NOTICE 'Created documents table';
    END IF;
END $$;

-- Check and create document_versions table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_versions') THEN
        CREATE TABLE document_versions (
            id SERIAL PRIMARY KEY,
            document_id INTEGER NOT NULL,
            version_number INTEGER NOT NULL,
            storage_key VARCHAR(255) NOT NULL,
            content_hash VARCHAR(255) NOT NULL,
            notes TEXT,
            content TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
        );
        RAISE NOTICE 'Created document_versions table';
    END IF;
END $$;

-- Check and create parcels table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
        CREATE TABLE parcels (
            id SERIAL PRIMARY KEY,
            parcel_number VARCHAR(100) NOT NULL UNIQUE,
            address VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(50),
            zip VARCHAR(20),
            latitude NUMERIC(10,7),
            longitude NUMERIC(10,7),
            area_sqft NUMERIC(14,2),
            zoning VARCHAR(50),
            geometry JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_parcels_parcel_number ON parcels(parcel_number);
        CREATE INDEX idx_parcels_address ON parcels(address);
        RAISE NOTICE 'Created parcels table';
    END IF;
END $$;

-- Check and create document_parcel_links table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_parcel_links') THEN
        CREATE TABLE document_parcel_links (
            id SERIAL PRIMARY KEY,
            document_id INTEGER NOT NULL,
            parcel_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            CONSTRAINT fk_parcel FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
            CONSTRAINT unique_document_parcel UNIQUE (document_id, parcel_id)
        );
        RAISE NOTICE 'Created document_parcel_links table';
    END IF;
END $$;

-- Check and create map_layers table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'map_layers') THEN
        CREATE TABLE map_layers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            source VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            visible BOOLEAN DEFAULT TRUE,
            opacity INTEGER DEFAULT 100,
            zindex INTEGER DEFAULT 0,
            order INTEGER NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created map_layers table';
        
        -- Insert default map layers
        INSERT INTO map_layers (name, source, type, visible, opacity, zindex, order, metadata) VALUES
        ('Property Boundaries', 'county_gis', 'vector', TRUE, 100, 10, 1, '{"style": {"color": "#ff0000", "weight": 2}, "description": "County property boundaries"}'),
        ('Zoning', 'county_gis', 'vector', TRUE, 75, 5, 2, '{"style": {"color": "#0000ff", "weight": 1}, "description": "Zoning classifications"}'),
        ('Aerial Imagery', 'esri', 'raster', TRUE, 100, 1, 3, '{"style": {}, "description": "Recent aerial photography"}'),
        ('Topographic', 'usgs', 'raster', FALSE, 100, 1, 4, '{"style": {}, "description": "USGS topographic map"}'),
        ('Roads', 'osm', 'vector', TRUE, 90, 15, 5, '{"style": {"color": "#333333", "weight": 3}, "description": "Road network"}'),
        ('Hydrography', 'county_gis', 'vector', TRUE, 80, 8, 6, '{"style": {"color": "#0077ff", "weight": 1}, "description": "Water features"}'),
        ('Building Footprints', 'county_gis', 'vector', TRUE, 85, 12, 7, '{"style": {"color": "#996633", "weight": 1}, "description": "Building outlines"}'),
        ('Tax Parcels', 'county_assessor', 'vector', TRUE, 90, 11, 8, '{"style": {"color": "#ff6600", "weight": 1}, "description": "Tax parcels"}'),
        ('Flood Zones', 'fema', 'vector', FALSE, 70, 7, 9, '{"style": {"color": "#0099ff", "weight": 1}, "description": "FEMA flood zones"}'),
        ('Historic Districts', 'county_gis', 'vector', FALSE, 60, 6, 10, '{"style": {"color": "#9900cc", "weight": 1}, "description": "Historic district boundaries"}');
        
        RAISE NOTICE 'Inserted default map layers';
    END IF;
END $$;

-- Fix map_layers table if it has null opacity values
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'map_layers') THEN
        UPDATE map_layers SET opacity = 100 WHERE opacity IS NULL;
        RAISE NOTICE 'Fixed null opacity values in map_layers table';
    END IF;
END $$;

-- Insert admin user if users table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        -- Insert admin user with password 'admin123'
        INSERT INTO users (username, password_hash, email, full_name, role)
        VALUES ('admin', '$2b$10$ZXKWvH1o2STDS3K9D.kS6eQZrQ/jTVL9Mj5yizZB0SF2CFn9clLHu', 'admin@example.com', 'Administrator', 'admin');
        RAISE NOTICE 'Created default admin user (username: admin, password: admin123)';
    END IF;
END $$;

-- Print table information
SELECT table_schema, table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = t.table_schema AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;