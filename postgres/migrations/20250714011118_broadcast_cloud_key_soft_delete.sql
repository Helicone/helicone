CREATE OR REPLACE FUNCTION broadcast_cloud_key_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'connected_cloud_gateways',           -- channel
    json_build_object(
      'event', 'api_key_updated',
      'organization_id', COALESCE(NEW.organization_id, OLD.organization_id),
      'api_key_hash', COALESCE(NEW.api_key_hash, OLD.api_key_hash),
      'soft_delete', COALESCE(NEW.soft_delete, OLD.soft_delete),
      'owner_id', COALESCE(NEW.user_id, OLD.user_id),
      'op', TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;