CREATE OR REPLACE FUNCTION broadcast_router_keys_change() RETURNS trigger AS $$
DECLARE
  org_id uuid;
  key_hash text;
BEGIN
  -- Get organization_id from the router join
  SELECT r.organization_id INTO org_id
  FROM routers r
  WHERE r.id = COALESCE(NEW.router_id, OLD.router_id);

  -- Get api_key_hash from helicone_api_keys
  SELECT api_key_hash INTO key_hash
  FROM helicone_api_keys
  WHERE id = COALESCE(NEW.api_key_id, OLD.api_key_id);

  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'router_keys_updated',
      'organization_id', org_id,
      'router_id', COALESCE(NEW.router_id, OLD.router_id),
      'api_key_hash', key_hash,
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_gateways_broadcast
AFTER INSERT OR UPDATE OR DELETE ON router_keys
FOR EACH ROW EXECUTE FUNCTION broadcast_router_keys_change();