import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

// Create Postgres client
const client = postgres(connectionString);

// Create Drizzle instance
export const db = drizzle(client);
