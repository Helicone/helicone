CREATE OR REPLACE FUNCTION broadcast_provider_keys_change() RETURNS trigger AS $$
DECLARE
  decrypted_key TEXT;
BEGIN
  -- Query the decrypted_provider_keys view to get the decrypted value
  SELECT decrypted_provider_key INTO decrypted_key
  FROM decrypted_provider_keys 
  WHERE id = COALESCE(NEW.id, OLD.id)
  LIMIT 1;

  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'provider_keys_updated',
      'organization_id', COALESCE(NEW.org_id, OLD.org_id),
      'provider_key', decrypted_key,  -- Use the decrypted value from the view
      'provider_name', COALESCE(NEW.provider_name, OLD.provider_name),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_gateways_broadcast
AFTER INSERT OR UPDATE OR DELETE ON provider_keys
FOR EACH ROW EXECUTE FUNCTION broadcast_provider_keys_change();