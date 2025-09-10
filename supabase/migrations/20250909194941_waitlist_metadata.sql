-- Add priority tracking columns to feature_waitlist table
ALTER TABLE public.feature_waitlist
ADD COLUMN IF NOT EXISTS priority_boost INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS original_position INTEGER,
    ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Delete duplicate entries, keeping only the oldest one for each email/feature combination
DELETE FROM public.feature_waitlist
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.feature_waitlist
    GROUP BY email, feature
);

-- Drop the existing unique constraint that includes organization_id
ALTER TABLE public.feature_waitlist 
DROP CONSTRAINT IF EXISTS feature_waitlist_email_feature_key;

-- Create a new unique constraint that only considers email and feature
-- This prevents duplicates regardless of organization_id
ALTER TABLE public.feature_waitlist
ADD CONSTRAINT feature_waitlist_email_feature_unique UNIQUE (email, feature);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feature_waitlist_email ON public.feature_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_feature_waitlist_feature ON public.feature_waitlist(feature);
CREATE INDEX IF NOT EXISTS idx_feature_waitlist_priority ON public.feature_waitlist(feature, priority_boost, created_at);

-- Update existing rows to have original_position
WITH positions AS (
    SELECT id,
        ROW_NUMBER() OVER (
            PARTITION BY feature
            ORDER BY created_at ASC
        ) as position
    FROM public.feature_waitlist
    WHERE original_position IS NULL
)
UPDATE public.feature_waitlist fw
SET original_position = p.position
FROM positions p
WHERE fw.id = p.id;