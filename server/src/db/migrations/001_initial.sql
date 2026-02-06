-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'field_officer' CHECK (role IN ('field_officer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    temp_id VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('one-on-one', 'group-meeting', 'sample-distribution', 'sale')),
    
    -- Location as PostGIS POINT
    location GEOGRAPHY(POINT, 4326),
    location_accuracy DECIMAL(10, 2),
    
    -- One-on-One fields
    person_name VARCHAR(255),
    category VARCHAR(50) CHECK (category IN ('Farmer', 'Seller', 'Influencer')),
    contact VARCHAR(50),
    business_potential INTEGER CHECK (business_potential >= 0 AND business_potential <= 10),
    notes TEXT,
    
    -- Group Meeting fields
    village_name VARCHAR(255),
    attendee_count INTEGER,
    meeting_type VARCHAR(50) CHECK (meeting_type IN ('Awareness', 'Product Demo', 'Training', 'Feedback')),
    
    -- Sample Distribution fields
    product_name VARCHAR(255),
    quantity DECIMAL(10, 2),
    recipient_name VARCHAR(255),
    purpose TEXT,
    
    -- Sale fields
    sale_type VARCHAR(50) CHECK (sale_type IN ('B2C', 'B2B')),
    product_sku VARCHAR(255),
    pack_size VARCHAR(50),
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    temp_id VARCHAR(255),
    url VARCHAR(500) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GPS Tracks table
CREATE TABLE IF NOT EXISTS gps_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(10, 2),
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_temp_id ON activities(temp_id);
CREATE INDEX IF NOT EXISTS idx_photos_activity_id ON photos(activity_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_user_id ON gps_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_tracked_at ON gps_tracks(tracked_at);

-- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_location ON gps_tracks USING GIST(location);

-- Insert demo user (password: password123)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'officer@occamy.com',
    '$2a$10$LVsLA9mtsHLWmofFyEpfMlbafG3Cl/uDQQlbyXD48T83BfnFfvpqO',
    'Demo Officer',
    'field_officer'
)
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$LVsLA9mtsHLWmofFyEpfMlbafG3Cl/uDQQlbyXD48T83BfnFfvpqO';
