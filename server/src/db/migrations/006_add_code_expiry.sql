-- Add expiration to admin_codes
ALTER TABLE admin_codes ADD COLUMN expires_at TIMESTAMPTZ;

-- Set default expiration for existing active codes to 24 hours from now
UPDATE admin_codes SET expires_at = NOW() + INTERVAL '24 hours' WHERE expires_at IS NULL;
