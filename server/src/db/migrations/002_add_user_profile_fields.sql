ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS territory VARCHAR(50),
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS admin_code VARCHAR(50);

-- Create admin_codes table for validation
CREATE TABLE IF NOT EXISTS admin_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  region VARCHAR(50) NOT NULL,
  manager_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed some initial admin codes
INSERT INTO admin_codes (code, region, manager_name) VALUES 
('OCCAMY-JAIPUR-2024', 'Jaipur', 'Sunita Sharma'),
('OCCAMY-INDORE-2024', 'Indore', 'Rajesh Gupta'),
('OCCAMY-AHMEDABAD-2024', 'Ahmedabad', 'Vikram Desai')
ON CONFLICT DO NOTHING;
