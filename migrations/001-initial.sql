-- Create sessions table for auth
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR(255) PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Create users table with auth provider support
CREATE TABLE IF NOT EXISTS "users" (
  "id" VARCHAR(255) PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "first_name" VARCHAR(255),
  "last_name" VARCHAR(255),
  "profile_image_url" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create counties table
CREATE TABLE IF NOT EXISTS "counties" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "state" VARCHAR(2) NOT NULL,
  "fips" VARCHAR(10) UNIQUE,
  "population" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "is_active" BOOLEAN DEFAULT TRUE,
  "metadata" JSON
);