import axios from "axios";

/**
 * Retrieves properties from the server.
 * @returns {Promise<any>} A promise that resolves to the properties data.
 */
const getProperties = async () => {
  const resp = await axios.get("/api/properties");
  return resp.data;
};

export { getProperties };
