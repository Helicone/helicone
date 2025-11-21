'''
Grab API keys from the db in prod or wherever....


```
select 
byok_enabled,
config,
decrypted_provider_key as provider_key,
provider_key_name,
provider_name,
coalesce(decrypted_provider_secret_key,'')  as provider_secret_key
from decrypted_provider_keys_v2 
where org_id = '....'
```

'''


import requests
import json
import os

if (os.environ["PRODUCTION_PROVIDER_API_KEYS"]):
    data = json.loads(os.environ["PRODUCTION_PROVIDER_API_KEYS"])
else:
    with open("keys.env.json", "r") as f:
        data = json.load(f)


def snake_to_camel(s: str) -> str:
    parts = s.split('_')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])


# Delete the seeded provider key first (from supabase/seeds/0_seed.sql)
seeded_key_id = "697e2a38-dacf-4073-b96b-de7a8fbf20f5"
delete_result = requests.delete(f"http://localhost:8585/v1/api-keys/provider-key/{seeded_key_id}",
                                headers={
                                    "Authorization": "Bearer sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi",
                                    "Content-Type": "application/json",
})
print(
    f"Deleted seeded key: {delete_result.status_code} - {delete_result.text}")

for d in data:
    d = {snake_to_camel(k): v for k, v in d.items()}
    result = requests.post("http://localhost:8585/v1/api-keys/provider-key",
                           json=d,
                           headers={
                               "Authorization": "Bearer sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi",
                               "Content-Type": "application/json",
                           })
    print(result.text)
    # exit()

# print(x)
