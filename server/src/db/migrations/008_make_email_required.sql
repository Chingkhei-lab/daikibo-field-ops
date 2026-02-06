-- Clean up any users with null emails (created during the brief optional period)
DELETE FROM users WHERE email IS NULL;

-- Make email required again
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
