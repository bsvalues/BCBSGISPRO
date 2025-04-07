CREATE TYPE "public"."map_base_layer" AS ENUM('satellite', 'streets', 'terrain', 'light', 'dark', 'custom');--> statement-breakpoint
CREATE TYPE "public"."map_layer_visibility" AS ENUM('visible', 'hidden', 'custom');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"parcel_id" integer,
	"type" varchar(50) NOT NULL,
	"geometry" json NOT NULL,
	"properties" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "arcgis_analysis_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"config_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"parameters" json NOT NULL,
	"result_geometry" json,
	"result_attributes" json,
	"status" varchar(20) DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "arcgis_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"url" varchar(255) NOT NULL,
	"layer_type" varchar(50) NOT NULL,
	"item_id" varchar(100),
	"portal_item" boolean DEFAULT false,
	"visible" boolean DEFAULT true,
	"opacity" double precision DEFAULT 1,
	"definition_expression" text,
	"layer_options" json,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "arcgis_map_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"portal_url" varchar(255) DEFAULT 'https://www.arcgis.com',
	"basemap_id" varchar(100) DEFAULT 'streets',
	"view_config" json,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "arcgis_sketches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"config_id" integer NOT NULL,
	"title" varchar(100),
	"sketch_type" varchar(50) NOT NULL,
	"geometry" json NOT NULL,
	"symbol_properties" json,
	"attributes" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_entities" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"description" text,
	"file_size" integer,
	"file_hash" varchar(128),
	"parcel_id" varchar(50),
	"uploaded_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "document_lineage_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_timestamp" timestamp DEFAULT now() NOT NULL,
	"document_id" varchar(36) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"performed_by" varchar(100),
	"details" json,
	"confidence" double precision
);
--> statement-breakpoint
CREATE TABLE "document_parcel_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"parcel_id" integer NOT NULL,
	"link_type" varchar(50) DEFAULT 'reference' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_processing_stages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"document_id" varchar(36) NOT NULL,
	"stage_name" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"processor_name" varchar(100),
	"processor_version" varchar(50),
	"progress" double precision DEFAULT 0 NOT NULL,
	"result" json
);
--> statement-breakpoint
CREATE TABLE "document_relationships" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"source_document_id" varchar(36) NOT NULL,
	"target_document_id" varchar(36) NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"description" text,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"parcel_id" integer,
	"upload_date" timestamp DEFAULT now(),
	"is_archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "map_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(100) NOT NULL,
	"description" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"zoom" integer NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"tags" json,
	"is_default" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "map_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"source" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text,
	"visible" boolean DEFAULT true,
	"opacity" integer DEFAULT 100,
	"zindex" integer DEFAULT 0,
	"order" integer DEFAULT 0,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "map_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"default_center" json NOT NULL,
	"default_zoom" integer DEFAULT 12 NOT NULL,
	"base_layer" "map_base_layer" DEFAULT 'streets' NOT NULL,
	"layer_visibility" "map_layer_visibility" DEFAULT 'visible' NOT NULL,
	"custom_base_layer" varchar(255),
	"layer_settings" json,
	"ui_settings" json,
	"theme" "theme" DEFAULT 'light' NOT NULL,
	"measurement" json DEFAULT '{"enabled":false,"unit":"imperial"}'::json,
	"snap_to_feature" boolean DEFAULT true,
	"show_labels" boolean DEFAULT true,
	"animation" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" serial PRIMARY KEY NOT NULL,
	"parcel_number" varchar(50) NOT NULL,
	"legal_description" text,
	"geometry" text,
	"owner" varchar(100),
	"address" varchar(200),
	"city" varchar(100),
	"zip" varchar(20),
	"property_type" varchar(50),
	"assessed_value" integer,
	"acres" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "parcels_parcel_number_unique" UNIQUE("parcel_number")
);
--> statement-breakpoint
CREATE TABLE "recently_viewed_parcels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"parcel_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"query" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"result_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" integer DEFAULT 0,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"full_name" varchar(100),
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workflow_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"form_data" json DEFAULT '{}'::json,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workflow_states_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_analysis_results" ADD CONSTRAINT "arcgis_analysis_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_analysis_results" ADD CONSTRAINT "arcgis_analysis_results_config_id_arcgis_map_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."arcgis_map_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_layers" ADD CONSTRAINT "arcgis_layers_config_id_arcgis_map_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."arcgis_map_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_map_configs" ADD CONSTRAINT "arcgis_map_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_sketches" ADD CONSTRAINT "arcgis_sketches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arcgis_sketches" ADD CONSTRAINT "arcgis_sketches_config_id_arcgis_map_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."arcgis_map_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lineage_events" ADD CONSTRAINT "document_lineage_events_document_id_document_entities_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_parcel_links" ADD CONSTRAINT "document_parcel_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_parcel_links" ADD CONSTRAINT "document_parcel_links_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_stages" ADD CONSTRAINT "document_processing_stages_document_id_document_entities_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_source_document_id_document_entities_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."document_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_target_document_id_document_entities_id_fk" FOREIGN KEY ("target_document_id") REFERENCES "public"."document_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_bookmarks" ADD CONSTRAINT "map_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_preferences" ADD CONSTRAINT "map_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed_parcels" ADD CONSTRAINT "recently_viewed_parcels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed_parcels" ADD CONSTRAINT "recently_viewed_parcels_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doc_parcel_idx" ON "document_parcel_links" USING btree ("document_id","parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_parcel_idx" ON "recently_viewed_parcels" USING btree ("user_id","parcel_id");