
REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    authenticated;

REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    service_role;

REVOKE all PRIVILEGES on decrypted_provider_keys_v2
from
    postgres;