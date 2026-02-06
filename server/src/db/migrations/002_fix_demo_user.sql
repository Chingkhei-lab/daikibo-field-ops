-- Seed script: Update demo user password
-- Run this to fix the demo user password hash

UPDATE users 
SET password_hash = '$2a$10$LVsLA9mtsHLWmofFyEpfMlbafG3Cl/uDQQlbyXD48T83BfnFfvpqO'
WHERE email = 'officer@occamy.com';

-- If user doesn't exist, insert them
INSERT INTO users (email, password_hash, name, role)
SELECT 'officer@occamy.com', '$2a$10$LVsLA9mtsHLWmofFyEpfMlbafG3Cl/uDQQlbyXD48T83BfnFfvpqO', 'Demo Officer', 'field_officer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'officer@occamy.com');
