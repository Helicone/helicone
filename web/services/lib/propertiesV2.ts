import { getJawnClient } from "../../lib/clients/jawn";

const getPropertiesV2 = async () => {
  const resp = await fetch("/api/propertiesV2");
  const data = await resp.json();
  return data;
};

const hideProperty = async (
  propertyToHide: string,
) => {
  const jawn = getJawnClient();

  return (
    await jawn.POST("/v1/properties/hide", {
      body: {
        propertyToHide,
      },
    })
  ).response;
};

export { getPropertiesV2, hideProperty };
