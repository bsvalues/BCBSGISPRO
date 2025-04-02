-- First, check if enum type exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_event_type') THEN
    CREATE TYPE workflow_event_type AS ENUM (
      'created',
      'updated',
      'status_changed',
      'priority_changed', 
      'document_added',
      'parcel_added'
    );
  END IF;
END $$;

-- Create the workflow_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_events (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  event_type workflow_event_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER REFERENCES users(id)
);