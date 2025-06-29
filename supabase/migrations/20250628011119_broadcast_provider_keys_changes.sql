CREATE OR REPLACE FUNCTION broadcast_provider_keys_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'provider_keys_updated',
      'organization_id', COALESCE(NEW.org_id, OLD.org_id),
      'provider_key', COALESCE(NEW.decrypted_provider_key, OLD.decrypted_provider_key),
      'provider_name', COALESCE(NEW.provider_name, OLD.provider_name),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_gateways_broadcast
AFTER INSERT OR UPDATE OR DELETE ON decrypted_provider_keys
FOR EACH ROW EXECUTE FUNCTION broadcast_provider_keys_change();