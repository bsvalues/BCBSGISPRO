#!/bin/bash

set -e

echo "=== TerraFusion Civil Infrastructure Platform Bootstrap ==="
echo "Initializing comprehensive GIS platform for county operations..."

check_prerequisites() {
    echo "Checking system prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "Node.js is required but not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo "PostgreSQL is required but not installed."
        read -p "Install PostgreSQL with PostGIS? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_postgresql
        else
            echo "Please install PostgreSQL manually and run this script again."
            exit 1
        fi
    fi
    
    echo "Prerequisites check completed."
}

install_postgresql() {
    echo "Installing PostgreSQL with PostGIS extension..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib postgis postgresql-14-postgis-3
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql postgis
            brew services start postgresql
        else
            echo "Please install Homebrew first, then run: brew install postgresql postgis"
            exit 1
        fi
    else
        echo "Unsupported operating system. Please install PostgreSQL manually."
        exit 1
    fi
}

setup_database() {
    echo "Setting up TerraFusion database..."
    
    read -p "Enter PostgreSQL username (default: postgres): " PG_USER
    PG_USER=${PG_USER:-postgres}
    
    read -s -p "Enter PostgreSQL password: " PG_PASS
    echo
    
    read -p "Enter database name (default: terrafusion): " DB_NAME
    DB_NAME=${DB_NAME:-terrafusion}
    
    export PGPASSWORD="$PG_PASS"
    
    if psql -h localhost -U "$PG_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "Database $DB_NAME already exists."
        read -p "Drop and recreate? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb -h localhost -U "$PG_USER" "$DB_NAME"
            createdb -h localhost -U "$PG_USER" "$DB_NAME"
        fi
    else
        createdb -h localhost -U "$PG_USER" "$DB_NAME"
    fi
    
    psql -h localhost -U "$PG_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    psql -h localhost -U "$PG_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
    
    echo "Database setup completed."
    
    DATABASE_URL="postgresql://$PG_USER:$PG_PASS@localhost:5432/$DB_NAME"
}

configure_environment() {
    echo "Configuring environment variables..."
    
    if [ -f .env ]; then
        echo "Existing .env file found."
        read -p "Backup and recreate? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mv .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        else
            echo "Keeping existing .env file. Manual configuration may be required."
            return
        fi
    fi
    
    echo "Creating environment configuration..."
    
    read -p "Enter Anthropic API key (required for document intelligence): " ANTHROPIC_KEY
    read -p "Enter Mapbox access token (optional, press enter to skip): " MAPBOX_TOKEN
    read -p "Enter ArcGIS API key (optional, press enter to skip): " ARCGIS_KEY
    
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# AI and External Services
ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
MAPBOX_ACCESS_TOKEN="$MAPBOX_TOKEN"
ARCGIS_API_KEY="$ARCGIS_KEY"

# Security Configuration
JWT_SECRET="$JWT_SECRET"
SESSION_SECRET="$SESSION_SECRET"

# Application Configuration
NODE_ENV="development"
PORT=5000
HOST="0.0.0.0"

# Feature Flags
ENABLE_DOCUMENT_CLASSIFICATION=true
ENABLE_REAL_TIME_COLLABORATION=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_AUDIT_LOGGING=true

# Performance Configuration
MAX_UPLOAD_SIZE="100mb"
WEBSOCKET_PING_INTERVAL=30000
DATABASE_POOL_SIZE=20

# Security Headers
CORS_ORIGIN="http://localhost:5000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    echo "Environment configuration completed."
}

install_dependencies() {
    echo "Installing project dependencies..."
    
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    echo "Dependencies installation completed."
}

setup_database_schema() {
    echo "Setting up database schema..."
    
    if [ ! -f shared/schema.ts ]; then
        echo "Database schema file not found. Creating default schema..."
        mkdir -p shared
        
        cat > shared/schema.ts << 'EOF'
import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

export const parcels = pgTable('parcels', {
  id: serial('id').primaryKey(),
  parcelId: varchar('parcel_id', { length: 50 }).notNull().unique(),
  ownerName: varchar('owner_name', { length: 255 }),
  propertyAddress: text('property_address'),
  assessedValue: decimal('assessed_value', { precision: 12, scale: 2 }),
  acreage: decimal('acreage', { precision: 10, scale: 4 }),
  zoning: varchar('zoning', { length: 50 }),
  geometry: jsonb('geometry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }),
  fileSize: integer('file_size'),
  classification: varchar('classification', { length: 100 }),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  extractedText: text('extracted_text'),
  metadata: jsonb('metadata'),
  parcelId: integer('parcel_id').references(() => parcels.id),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParcelSchema = createInsertSchema(parcels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
EOF
    fi
    
    npm run db:push
    echo "Database schema setup completed."
}

create_initial_admin() {
    echo "Creating initial administrator account..."
    
    read -p "Enter admin email: " ADMIN_EMAIL
    read -s -p "Enter admin password: " ADMIN_PASSWORD
    echo
    
    node -e "
    const bcrypt = require('bcryptjs');
    const { drizzle } = require('drizzle-orm/postgres-js');
    const postgres = require('postgres');
    const { users } = require('./shared/schema');
    
    async function createAdmin() {
        const client = postgres(process.env.DATABASE_URL);
        const db = drizzle(client);
        
        const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 12);
        
        try {
            await db.insert(users).values({
                email: '$ADMIN_EMAIL',
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                passwordHash: hashedPassword
            });
            console.log('Administrator account created successfully.');
        } catch (error) {
            if (error.code === '23505') {
                console.log('Administrator account already exists.');
            } else {
                console.error('Error creating administrator:', error.message);
            }
        }
        
        await client.end();
    }
    
    createAdmin();
    "
}

run_initial_tests() {
    echo "Running initial system tests..."
    
    echo "Testing database connection..."
    npm run db:push --silent > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ Database connection successful"
    else
        echo "✗ Database connection failed"
        exit 1
    fi
    
    echo "Testing API endpoints..."
    npm start > /dev/null 2>&1 &
    SERVER_PID=$!
    
    sleep 5
    
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✓ Server health check passed"
    else
        echo "✗ Server health check failed"
        kill $SERVER_PID
        exit 1
    fi
    
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    
    echo "Initial tests completed successfully."
}

generate_ssl_certificates() {
    echo "Generating SSL certificates for development..."
    
    if [ ! -d "certs" ]; then
        mkdir certs
    fi
    
    if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ]; then
        openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes -subj "/C=US/ST=WA/L=Corvallis/O=Benton County/CN=localhost"
        echo "SSL certificates generated."
    else
        echo "SSL certificates already exist."
    fi
}

setup_systemd_service() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        read -p "Create systemd service for production deployment? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo tee /etc/systemd/system/terrafusion.service > /dev/null << EOF
[Unit]
Description=TerraFusion GIS Platform
After=network.target postgresql.service

[Service]
Type=simple
User=terrafusion
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
            
            sudo systemctl daemon-reload
            echo "Systemd service created. Enable with: sudo systemctl enable terrafusion"
        fi
    fi
}

main() {
    echo "Starting TerraFusion bootstrap process..."
    
    check_prerequisites
    setup_database
    configure_environment
    install_dependencies
    setup_database_schema
    create_initial_admin
    generate_ssl_certificates
    run_initial_tests
    setup_systemd_service
    
    echo ""
    echo "=== TerraFusion Bootstrap Completed Successfully ==="
    echo ""
    echo "Next steps:"
    echo "1. Review and customize the .env file as needed"
    echo "2. Start the development server: npm run dev"
    echo "3. Access the application at: http://localhost:5000"
    echo "4. Log in with the administrator account you created"
    echo ""
    echo "For production deployment:"
    echo "1. Set NODE_ENV=production in .env"
    echo "2. Build the application: npm run build"
    echo "3. Start with: npm start"
    echo ""
    echo "Documentation available in README.md and PRD.md"
    echo "Happy mapping!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi