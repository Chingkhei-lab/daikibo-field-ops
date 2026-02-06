-- Fix Schema Mismatches and Add Missing Tables

-- 1. Fix Activities Table
-- Add missing columns to activities table and update check constraint
ALTER TABLE activities ADD COLUMN IF NOT EXISTS temp_id VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_accuracy FLOAT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS person_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS contact VARCHAR(20);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS business_potential VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS village_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendee_count INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS product_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS product_sku VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pack_size VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS farm_id UUID; -- For linking activities to farms

-- Update check constraint for activity types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (type IN ('one-on-one', 'group-meeting', 'sample-distribution', 'sale', 'meeting', 'visit', 'issue'));

-- 2. Fix GPS Tracks Table
-- Rename timestamp to tracked_at to match code, or add tracked_at
ALTER TABLE gps_tracks RENAME COLUMN timestamp TO tracked_at;

-- 3. Fix Farms Table
-- Add aliases/alternative names or rename columns to match code usage
ALTER TABLE farms ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS village VARCHAR(100);
-- Sync values if they already exist
UPDATE farms SET name = farmer_name WHERE name IS NULL;
UPDATE farms SET village = village_name WHERE village IS NULL;

-- 4. Create Daily Assignments Table
CREATE TABLE IF NOT EXISTS daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    farm_id VARCHAR(50), -- Using VARCHAR to support both UUIDs and demo IDs
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'visited', 'skipped')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON daily_assignments(user_id, date);
