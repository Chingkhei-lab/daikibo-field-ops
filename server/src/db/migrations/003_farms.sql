-- Farms Table
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    village VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    priority VARCHAR(20) CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Assignments Table
CREATE TABLE IF NOT EXISTS daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    farm_ids UUID[], -- Array of farm UUIDs
    completed_ids UUID[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'assigned', -- assigned, in-progress, completed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data (3 Farms near Jaipur)
INSERT INTO farms (id, name, village, location, contact_name, contact_phone, priority) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ram Lal Dairy', 'Nagpur', ST_SetSRID(ST_MakePoint(75.8770, 26.9150), 4326), 'Ram Lal', '9876543210', 'High'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Shyam Cattle Farm', 'Deoli', ST_SetSRID(ST_MakePoint(75.8820, 26.9220), 4326), 'Shyam Singh', '9876543211', 'Medium'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Krishna Gowshala', 'Bassi', ST_SetSRID(ST_MakePoint(75.8950, 26.9310), 4326), 'Krishna Kumar', '9876543212', 'Low')
ON CONFLICT (id) DO NOTHING;

-- Seed Assignment for "today" (Assuming user ID will be fetched or we use a placeholder/loop if needed, but for now we insert farms. Assignment logic is dynamic)
-- Note: We rely on the endpoint to "fetch todays assignment", which might need to auto-create one if missing for demo purposes, or we seed one here if we know the officer ID.
-- Since we don't know the officer ID deterministically, we will handle assignment creation in the API or manually later.
