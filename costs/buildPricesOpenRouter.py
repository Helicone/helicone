import requests
import json
from decimal import Decimal


class FancyFloat(float):
    def __repr__(self):
        return format(Decimal(self), "f")


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return FancyFloat(obj)
        return json.JSONEncoder.default(self, obj)


def fetch_data_and_map():
    url = "https://openrouter.ai/api/v1/models"
    response = requests.get(url)

    if response.status_code == 200:
        data = response. json()["data"]
        mapped_data = []

        for item in data:
            model_id = item["id"]
            prompt_token_cost = Decimal(item["pricing"]["prompt"])
            completion_token_cost = Decimal(item["pricing"]["completion"])

            mapped_item = {
                "model": {
                    "operator": "equals",
                    "value": model_id
                },
                "cost": {
                    "prompt_token": prompt_token_cost,
                    "completion_token": completion_token_cost
                }
            }

            mapped_data.append(mapped_item)

        return mapped_data
    else:
        print("Failed to fetch data from the endpoint.")
        return None


# Usage
mapped_data = fetch_data_and_map()
if mapped_data:
    print(json.dumps(mapped_data, cls=DecimalEncoder, indent=2))

exit()
