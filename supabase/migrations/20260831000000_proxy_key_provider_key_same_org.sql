-- CIRT-80: a proxy key must only ever map to a provider key owned by the same
-- organization. Application code now scopes the lookup by org_id; this makes
-- the invariant hold at the database regardless of what any caller does.
--
-- The foreign key is added NOT VALID so it is enforced for all new and updated
-- rows immediately without failing the migration if historical violations
-- exist. Audit existing rows before validating:
--
--   SELECT pk.id, pk.org_id AS proxy_org, p.org_id AS provider_org
--   FROM helicone_proxy_keys pk
--   JOIN provider_keys p ON p.id = pk.provider_key_id
--   WHERE pk.org_id <> p.org_id;
--
-- Any rows returned are evidence of cross-tenant mappings and should be
-- escalated (see CIRT-74) and removed. Once the query is empty, run:
--
--   ALTER TABLE public.helicone_proxy_keys
--     VALIDATE CONSTRAINT helicone_proxy_keys_provider_key_same_org_fk;

ALTER TABLE public.provider_keys
  ADD CONSTRAINT provider_keys_id_org_id_unique UNIQUE (id, org_id);

ALTER TABLE public.helicone_proxy_keys
  ADD CONSTRAINT helicone_proxy_keys_provider_key_same_org_fk
  FOREIGN KEY (provider_key_id, org_id)
  REFERENCES public.provider_keys (id, org_id)
  NOT VALID;
