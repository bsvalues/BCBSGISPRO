-- Fix script for workflow_events table
-- This script will create the workflow_events table if it doesn't exist
-- and fix any issues with its structure

-- Check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_events') THEN
        CREATE TABLE workflow_events (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL,
            event_type VARCHAR(255) NOT NULL,
            event_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_workflow_id FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Created workflow_events table';
    ELSE
        RAISE NOTICE 'workflow_events table already exists';
    END IF;
END $$;

-- Check and add any missing columns
DO $$
BEGIN
    -- Check if event_data column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'workflow_events' 
                   AND column_name = 'event_data') THEN
        ALTER TABLE workflow_events ADD COLUMN event_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added event_data column to workflow_events table';
    END IF;
    
    -- Check if created_at column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'workflow_events' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE workflow_events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to workflow_events table';
    END IF;
END $$;

-- Add proper foreign key constraints if missing
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'fk_workflow_id' 
                   AND conrelid = 'workflow_events'::regclass) THEN
        -- Add the foreign key constraint
        ALTER TABLE workflow_events 
        ADD CONSTRAINT fk_workflow_id
        FOREIGN KEY (workflow_id) 
        REFERENCES workflows(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for workflow_id';
    END IF;
END $$;

-- Create an index on workflow_id for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'workflow_events' 
                   AND indexname = 'idx_workflow_events_workflow_id') THEN
        CREATE INDEX idx_workflow_events_workflow_id ON workflow_events(workflow_id);
        RAISE NOTICE 'Created index on workflow_id column';
    END IF;
END $$;

-- Create an index on event_type for filtering events by type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'workflow_events' 
                   AND indexname = 'idx_workflow_events_event_type') THEN
        CREATE INDEX idx_workflow_events_event_type ON workflow_events(event_type);
        RAISE NOTICE 'Created index on event_type column';
    END IF;
END $$;

-- Create an index on created_at for time-based queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'workflow_events' 
                   AND indexname = 'idx_workflow_events_created_at') THEN
        CREATE INDEX idx_workflow_events_created_at ON workflow_events(created_at);
        RAISE NOTICE 'Created index on created_at column';
    END IF;
END $$;

-- Check and update the sequence if it's out of sync
DO $$
DECLARE
    max_id INTEGER;
    seq_name TEXT := 'workflow_events_id_seq';
BEGIN
    -- Get the maximum id from the table
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM workflow_events;
    
    -- Set the sequence to be greater than the max id
    EXECUTE format('SELECT setval(%L, %s, %s)', 
                  seq_name, 
                  max_id, 
                  max_id > 0);
                  
    RAISE NOTICE 'Updated sequence % to %', seq_name, max_id;
END $$;

-- Insert a test event if the table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM workflow_events) = 0 THEN
        -- Make sure we have at least one workflow
        IF (SELECT COUNT(*) FROM workflows) = 0 THEN
            INSERT INTO workflows (name, type, status, user_id, created_at, updated_at)
            VALUES ('Sample Workflow', 'property_assessment', 'active', NULL, NOW(), NOW());
            RAISE NOTICE 'Created a sample workflow since none existed';
        END IF;
        
        -- Get the first workflow id
        WITH first_workflow AS (
            SELECT id FROM workflows LIMIT 1
        )
        INSERT INTO workflow_events (workflow_id, event_type, event_data, created_at)
        SELECT id, 'system_initialized', '{"message": "System initialized workflow events table"}', NOW()
        FROM first_workflow;
        
        RAISE NOTICE 'Added a test event to the workflow_events table';
    END IF;
END $$;

-- Print table information
SELECT 'Table Information:' AS info;
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflow_events'
ORDER BY ordinal_position;

-- Print constraint information
SELECT 'Constraint Information:' AS info;
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' AND tc.table_name = 'workflow_events';

-- Print index information
SELECT 'Index Information:' AS info;
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'workflow_events';

-- Print the number of records
SELECT 'Record Count:' AS info;
SELECT COUNT(*) AS record_count FROM workflow_events;