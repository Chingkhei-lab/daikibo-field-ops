-- Final Schema Alignment Fix (Consolidated & Defensive)
-- This ensures all columns used in server routes exist in the database with correct names and types

-- 1. Fix Activities Table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS temp_id VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_accuracy FLOAT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS person_name VARCHAR(100);

-- Fix business_potential type (Change from integer to varchar)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='business_potential' AND data_type='integer') THEN
        ALTER TABLE activities ALTER COLUMN business_potential TYPE VARCHAR(50) USING business_potential::text;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='business_potential') THEN
        ALTER TABLE activities ADD COLUMN business_potential VARCHAR(50);
    END IF;
END $$;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS contact VARCHAR(20);
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
ALTER TABLE activities ADD COLUMN IF NOT EXISTS farm_id UUID; 

-- Update activity types constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (type IN ('one-on-one', 'group-meeting', 'sample-distribution', 'sale', 'meeting', 'visit', 'issue'));

-- 2. Fix GPS Tracks Alignment
DO $$ 
BEGIN
    -- Rename if old column exists and new one doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gps_tracks' AND column_name='timestamp') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gps_tracks' AND column_name='tracked_at') THEN
        ALTER TABLE gps_tracks RENAME COLUMN timestamp TO tracked_at;
    END IF;
END $$;
-- Ensure tracked_at exists
ALTER TABLE gps_tracks ADD COLUMN IF NOT EXISTS tracked_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Fix Farms Table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS village VARCHAR(100);

-- Only update if farmer_name exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farms' AND column_name='farmer_name') THEN
        UPDATE farms SET name = farmer_name WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farms' AND column_name='village_name') THEN
        UPDATE farms SET village = village_name WHERE village IS NULL;
    END IF;
END $$;

-- 4. Fix Daily Assignments Table
-- The code expects user_id and farm_id (singular), but old migrations had officer_id and farm_ids (array)
DO $$ 
BEGIN
    -- If daily_assignments exists, ensure it has the right columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='daily_assignments') THEN
        -- Add user_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_assignments' AND column_name='user_id') THEN
            ALTER TABLE daily_assignments ADD COLUMN user_id UUID REFERENCES users(id);
            -- Migration: copy officer_id to user_id if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_assignments' AND column_name='officer_id') THEN
                UPDATE daily_assignments SET user_id = officer_id;
            END IF;
        END IF;

        -- Add farm_id (singular) if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_assignments' AND column_name='farm_id') THEN
            ALTER TABLE daily_assignments ADD COLUMN farm_id VARCHAR(50);
            -- Migration: if farm_ids (array) exists, take the first one
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_assignments' AND column_name='farm_ids') THEN
                UPDATE daily_assignments SET farm_id = (farm_ids[1])::text WHERE farm_id IS NULL AND array_length(farm_ids, 1) > 0;
            END IF;
        END IF;
    ELSE
        -- Create table fresh if it doesn't exist
        CREATE TABLE daily_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            farm_id VARCHAR(50), 
            date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'visited', 'skipped', 'assigned', 'in-progress', 'completed')),
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'Low', 'Medium', 'High')),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON daily_assignments(user_id, date);
