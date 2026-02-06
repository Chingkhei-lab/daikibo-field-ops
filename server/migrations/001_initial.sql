-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('field_officer', 'distributor', 'admin')),
    phone VARCHAR(15) UNIQUE NOT NULL,
    territory GEOGRAPHY(POLYGON, 4326),
    password_hash VARCHAR(255), -- For basic auth
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Server ID
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) CHECK (type IN ('meeting', 'sale', 'visit', 'issue')),
    location GEOGRAPHY(POINT, 4326),
    data JSONB DEFAULT '{}',
    photos TEXT[],
    client_id VARCHAR(50), -- Reference to local Dexie ID if needed for debugging
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id),
    sku VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS Tracks
CREATE TABLE IF NOT EXISTS gps_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    accuracy FLOAT
);
