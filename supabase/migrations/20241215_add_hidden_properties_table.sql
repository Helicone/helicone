CREATE TABLE "public"."hidden_properties" (
                                              "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                              "organization_id" UUID NOT NULL REFERENCES organization(id),
                                              "property_key" TEXT NOT NULL,
                                              "hidden_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              "hidden_by" UUID REFERENCES auth.users(id)
);

-- ensure no duplicates
CREATE UNIQUE INDEX hidden_properties_org_key_unique
    ON "public"."hidden_properties" ("organization_id", "property_key");

-- Enable Row Level Security
ALTER TABLE "public"."hidden_properties" ENABLE ROW LEVEL SECURITY;
