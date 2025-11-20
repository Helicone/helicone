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


for d in data:
    d = {snake_to_camel(k): v for k, v in d.items()}
    print(d)
    result = requests.post("http://localhost:8585/v1/api-keys/provider-key",
                           json=d,
                           headers={
                               "Authorization": "Bearer sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi",
                               "Content-Type": "application/json",
                           })
    print(result.text)
    # exit()

# print(x)
