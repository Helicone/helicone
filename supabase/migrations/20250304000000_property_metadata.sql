-- Create property_metadata table for soft deletion and other metadata
CREATE TABLE "public"."property_metadata" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "organization_id" uuid NOT NULL REFERENCES public.organization(id),
    "property_key" text NOT NULL,
    "description" text,
    "soft_delete" boolean NOT NULL DEFAULT false,
    "deleted_at" timestamp with time zone
);
-- Create a unique constraint on organization_id and property_key
CREATE UNIQUE INDEX property_metadata_org_key_idx ON public.property_metadata (organization_id, property_key);
REVOKE ALL ON TABLE "public"."property_metadata"
FROM anon,
    authenticated,
    service_role;