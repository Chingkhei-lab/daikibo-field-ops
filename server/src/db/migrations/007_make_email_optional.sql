-- Make email nullable to support phone-only login for officers
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Ensure phone is unique if provided
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key') THEN 
        ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
END $$;
