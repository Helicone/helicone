import axios from "axios";

const getProperties = async () => {
  const resp = await axios.get("/api/properties");
  return resp.data;
};

export { getProperties };
