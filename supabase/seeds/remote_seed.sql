-- Safe seed for remote Supabase instance
-- NOTE: Users should be created via Supabase Auth dashboard/API, not direct inserts

-- Create test organizations (using placeholder UUIDs - update with real user IDs after creating users)
INSERT INTO public.organization (id, name, owner, has_onboarded, organization_type, tier)
VALUES
    ('83635a30-5ba6-41a8-8cc6-fb7df941b24a', 'Test Organization', 'f76629c5-a070-4bbc-9918-64beaea48848', true, 'reseller', 'enterprise'),
    ('a75d76e3-02e7-4d02-8a2b-c65ed27c69b2', 'Admin Organization', 'd9064bb5-1501-4ec9-bfee-21ab74d645b8', true, 'reseller', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Create organization members (update user IDs to match real users)
INSERT INTO public.organization_member (member, organization, org_role) VALUES
('f76629c5-a070-4bbc-9918-64beaea48848', '83635a30-5ba6-41a8-8cc6-fb7df941b24a', 'owner'),
('d9064bb5-1501-4ec9-bfee-21ab74d645b8', 'a75d76e3-02e7-4d02-8a2b-c65ed27c69b2', 'owner')
ON CONFLICT DO NOTHING;

-- Create Helicone API keys
-- sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa for Test Organization
INSERT INTO public.helicone_api_keys (api_key_hash, api_key_name, user_id, organization_id, soft_delete, key_permissions)
VALUES
('014c02f17208d4f521b0bad39a1d0174e015e86f925cbbcc25108ffea74fd7f2', 'Test', 'f76629c5-a070-4bbc-9918-64beaea48848', '83635a30-5ba6-41a8-8cc6-fb7df941b24a', FALSE, 'rw')
ON CONFLICT DO NOTHING;

-- sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi for Admin Organization
INSERT INTO public.helicone_api_keys (api_key_hash, api_key_name, user_id, organization_id, soft_delete, key_permissions)
VALUES
('4a6ced8c61492670cfd56f31e6e4c40e7cf8c6b88b7ab0a70efc5f86c136b9c3', 'Admin', 'd9064bb5-1501-4ec9-bfee-21ab74d645b8', 'a75d76e3-02e7-4d02-8a2b-c65ed27c69b2', FALSE, 'rw')
ON CONFLICT DO NOTHING;

-- Create admin entries
INSERT INTO public.admins (user_id, user_email) VALUES
('f76629c5-a070-4bbc-9918-64beaea48848', 'test@helicone.ai'),
('d9064bb5-1501-4ec9-bfee-21ab74d645b8', 'admin@helicone.ai')
ON CONFLICT DO NOTHING;

-- Enable credits feature flag for test organization
INSERT INTO public.feature_flags (org_id, feature)
VALUES
('83635a30-5ba6-41a8-8cc6-fb7df941b24a', 'credits')
ON CONFLICT DO NOTHING;
