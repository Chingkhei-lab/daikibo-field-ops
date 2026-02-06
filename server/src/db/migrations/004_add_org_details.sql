ALTER TABLE users ADD COLUMN organization VARCHAR(255);
ALTER TABLE users ADD COLUMN website VARCHAR(255);

-- Seed data for Anny
UPDATE users 
SET organization = 'Ocammy', website = 'ocammy.com' 
WHERE email = 'anny1@ocammy.com';
