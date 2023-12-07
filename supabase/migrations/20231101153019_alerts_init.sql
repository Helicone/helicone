CREATE TABLE alert (
    id uuid not null default gen_random_uuid() primary key,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    metric TEXT NOT NULL,
    threshold DECIMAL NOT NULL,
    time_window BIGINT NOT NULL,
    time_block_duration BIGINT NOT NULL DEFAULT 60000,
    emails TEXT [] NOT NULL,
    name TEXT NOT NULL,
    soft_delete boolean not null default false,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
);
CREATE TABLE alert_history (
    id uuid not null default gen_random_uuid() primary key,
    org_id UUID NOT NULL REFERENCES public.organization(id),
    alert_id UUID REFERENCES alert(id) NOT NULL,
    alert_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    alert_end_time TIMESTAMP WITH TIME ZONE,
    alert_metric TEXT NOT NULL,
    triggered_value TEXT NOT NULL,
    -- Value that triggered the alert
    status TEXT NOT NULL,
    -- Triggered, Resolved
    soft_delete boolean not null default false,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
);
ALTER TABLE alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;