-- Add columns for waitlist tracking
ALTER TABLE public.feature_waitlist
ADD COLUMN IF NOT EXISTS priority_boost INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS original_position INTEGER,
    ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';