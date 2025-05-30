import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Initialize a proper client
const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('Starting migration...');
  
  try {
    // Execute a check query first
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'workflow_events'
      ) as "exists"
    `;
    
    console.log('Workflow events table check:', result[0].exists);
    
    if (!result[0].exists) {
      console.log('Creating missing table workflow_events...');
      
      // Check if we need to create the enum first
      const enumResult = await client`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = 'workflow_event_type'
        ) as "exists"
      `;
      
      if (!enumResult[0].exists) {
        console.log('Creating workflow_event_type enum...');
        await client`
          CREATE TYPE workflow_event_type AS ENUM (
            'created',
            'updated',
            'status_changed',
            'priority_changed',
            'document_added',
            'parcel_added'
          )
        `;
      }
      
      // Create the workflow_events table
      await client`
        CREATE TABLE IF NOT EXISTS workflow_events (
          id SERIAL PRIMARY KEY,
          workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
          event_type workflow_event_type NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          created_by INTEGER REFERENCES users(id)
        )
      `;
      
      console.log('Successfully created workflow_events table!');
    } else {
      console.log('workflow_events table already exists.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

main();