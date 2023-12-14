import axios from "axios";

/**
 * Retrieves feedback data from the server.
 * @returns {Promise<any>} A promise that resolves to the feedback data.
 */
const getFeedback = async () => {
  const resp = await axios.get("/api/feedback");
  return resp.data.data;
};

export { getFeedback };
