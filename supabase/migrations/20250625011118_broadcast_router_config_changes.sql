CREATE OR REPLACE FUNCTION broadcast_router_config_change() RETURNS trigger AS $$
DECLARE
  org_id uuid;
  router_hash varchar(255);
BEGIN
  -- Get organization_id from the router join
  SELECT r.organization_id, r.hash INTO org_id, router_hash
  FROM routers r
  WHERE r.id = COALESCE(NEW.router_id, OLD.router_id);

  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'router_config_updated',
      'organization_id', org_id,
      'router_hash', router_hash,
      'router_config_id', COALESCE(NEW.id, OLD.id),
      'config', COALESCE(NEW.config, OLD.config),
      'version', COALESCE(NEW.version, OLD.version),
      'router_id', COALESCE(NEW.router_id, OLD.router_id),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_gateways_broadcast
AFTER INSERT OR UPDATE OR DELETE ON router_config_versions
FOR EACH ROW EXECUTE FUNCTION broadcast_router_config_change();