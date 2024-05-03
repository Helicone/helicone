const getPropertiesV2 = async () => {
  const resp = await fetch("/api/propertiesV2");
  const data = await resp.json();
  return data;
};

export { getPropertiesV2 };
