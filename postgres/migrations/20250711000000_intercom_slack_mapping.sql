-- Create table to store Intercom-Slack message mappings
CREATE TABLE IF NOT EXISTS public.intercom_slack_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intercom_conversation_id TEXT NOT NULL,
    intercom_message_id TEXT NOT NULL,
    slack_channel_id TEXT NOT NULL,
    slack_thread_ts TEXT NOT NULL,
    slack_message_ts TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

revoke all on table "public"."intercom_slack_mappings" from anon, authenticated, public;
-- Create indexes for faster lookups
CREATE INDEX idx_intercom_slack_mappings_intercom_conversation ON public.intercom_slack_mappings(intercom_conversation_id);
CREATE INDEX idx_intercom_slack_mappings_slack_thread ON public.intercom_slack_mappings(slack_thread_ts);
CREATE INDEX idx_intercom_slack_mappings_intercom_message ON public.intercom_slack_mappings(intercom_message_id);

-- Add RLS policy (assuming you have RLS enabled)
ALTER TABLE public.intercom_slack_mappings ENABLE ROW LEVEL SECURITY;
