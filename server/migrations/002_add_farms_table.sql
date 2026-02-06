-- Add farms table to store farm registrations
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    village_name VARCHAR(100) NOT NULL,
    cattle_count INTEGER DEFAULT 0,
    land_size DECIMAL(10,2), -- in acres
    location GEOGRAPHY(POINT, 4326),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_farms_created_by ON farms(created_by);
CREATE INDEX IF NOT EXISTS idx_farms_village ON farms(village_name);
