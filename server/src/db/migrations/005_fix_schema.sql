-- Enable PostGIS extension if not loaded (Critical for farms table)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure admin_codes columns exist (Fix for 003_add_onetime_codes.sql)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_codes' AND column_name='is_one_time') THEN 
        ALTER TABLE admin_codes ADD COLUMN is_one_time BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_codes' AND column_name='is_used') THEN 
        ALTER TABLE admin_codes ADD COLUMN is_used BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_codes' AND column_name='created_by') THEN 
        ALTER TABLE admin_codes ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    -- Relax constraints to allow generic codes
    ALTER TABLE admin_codes ALTER COLUMN region DROP NOT NULL;
    ALTER TABLE admin_codes ALTER COLUMN manager_name DROP NOT NULL;
END $$;

-- Ensure daily_assignments table exists (Fix for 003_farms.sql failure)
CREATE TABLE IF NOT EXISTS daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    farm_ids UUID[], 
    completed_ids UUID[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'assigned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure farms table exists
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    village VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    priority VARCHAR(20) CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure activities table exists (Fix for /officers query)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}',
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user columns for organization (Fix for 004_add_org_details.sql)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organization') THEN 
        ALTER TABLE users ADD COLUMN organization VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='website') THEN 
        ALTER TABLE users ADD COLUMN website VARCHAR(255);
    END IF;
END $$;

-- Re-seed Anny schema just in case
UPDATE users 
SET organization = 'Ocammy', website = 'ocammy.com' 
WHERE email = 'anny1@ocammy.com';
