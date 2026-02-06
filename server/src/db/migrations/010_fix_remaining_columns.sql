-- Add missing columns to daily_assignments
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_assignments' AND column_name='priority') THEN 
        ALTER TABLE daily_assignments ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
END $$;

-- Add activity_status to farms (aliased or separate column)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farms' AND column_name='activity_status') THEN 
        ALTER TABLE farms ADD COLUMN activity_status VARCHAR(50) DEFAULT 'Pending';
        -- Update activity_status based on existing status if needed
        UPDATE farms SET activity_status = 'Active' WHERE status = 'active';
    END IF;
END $$;
