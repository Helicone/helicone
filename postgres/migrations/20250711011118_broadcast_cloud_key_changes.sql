CREATE OR REPLACE FUNCTION broadcast_cloud_key_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'api_key_updated',
      'organization_id', COALESCE(NEW.organization_id, OLD.organization_id),
      'api_key_hash', COALESCE(NEW.api_key_hash, OLD.api_key_hash),
      'owner_id', COALESCE(NEW.user_id, OLD.user_id),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_cloud_gateways_broadcast_keys
AFTER INSERT OR UPDATE OR DELETE ON helicone_api_keys
FOR EACH ROW EXECUTE FUNCTION broadcast_cloud_key_change();