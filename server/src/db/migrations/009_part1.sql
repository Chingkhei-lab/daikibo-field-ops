-- Atomic Migration 1: Activities Table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS temp_id VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_accuracy FLOAT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS person_name VARCHAR(100);

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='business_potential' AND data_type='integer') THEN
        ALTER TABLE activities ALTER COLUMN business_potential TYPE VARCHAR(50) USING business_potential::text;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='business_potential') THEN
        ALTER TABLE activities ADD COLUMN business_potential VARCHAR(50);
    END IF;
END $$;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS contact VARCHAR(20);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS village_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendee_count INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS product_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS product_sku VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pack_size VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS farm_id UUID; 

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (type IN ('one-on-one', 'group-meeting', 'sample-distribution', 'sale', 'meeting', 'visit', 'issue'));
