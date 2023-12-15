const getProperties = async () => {
  const resp = await fetch("/api/properties");
  const data = await resp.json();
  return data;
};

export { getProperties };
