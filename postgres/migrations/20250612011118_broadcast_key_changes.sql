CREATE OR REPLACE FUNCTION broadcast_key_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'connected_gateways',           -- channel
    json_build_object(
      'event', 'api_key_updated',
      'organization_id', COALESCE(NEW.organization_id, OLD.organization_id),
      'api_key_id', COALESCE(NEW.id, OLD.id),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_connected_gateways_broadcast
AFTER INSERT OR UPDATE OR DELETE ON helicone_api_keys
FOR EACH ROW EXECUTE FUNCTION broadcast_key_change();