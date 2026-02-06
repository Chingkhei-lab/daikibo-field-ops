ALTER TABLE admin_codes ADD COLUMN is_one_time BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_codes ADD COLUMN is_used BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_codes ADD COLUMN created_by UUID REFERENCES users(id);

-- Create a generic One-Time code type
ALTER TABLE admin_codes ALTER COLUMN region DROP NOT NULL;
ALTER TABLE admin_codes ALTER COLUMN manager_name DROP NOT NULL;
