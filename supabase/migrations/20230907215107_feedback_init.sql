ALTER TABLE public.provider_keys
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.helicone_proxy_keys
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS feedback_metrics CASCADE;
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    response_id UUID NOT NULL UNIQUE REFERENCES public.response(id),
    rating BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_feedback_response ON public.feedback(response_id);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.feedback
FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.feedback
FROM authenticated;