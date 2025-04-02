import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

// Configure Postgres client options with better error handling and reconnection
const pgOptions = {
  max: 10, // connection pool max size
  idle_timeout: 20, // how long a connection can stay idle before being closed
  connect_timeout: 10, // connection timeout in seconds
  max_lifetime: 60 * 30, // how long a connection can live before being closed
  ssl: {
    // Force allow unauthorized for development (self-signed certs)
    rejectUnauthorized: false,
  },
};

// Create Postgres client with error handling
const client = postgres(connectionString, pgOptions);

// Create Drizzle instance
export const db = drizzle(client);

// Add connection error handling
process.on('SIGINT', () => {
  console.log('Closing database connections before shutdown');
  client.end({ timeout: 5 }).catch(err => {
    console.error('Error closing database connections:', err);
  });
});
