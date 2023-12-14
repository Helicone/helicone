import axios from "axios";

/**
 * Retrieves prompt values from the server.
 * @returns {Promise<any>} A promise that resolves to the prompt values.
 */
const getPromptValues = async () => {
  const resp = await axios.get("/api/prompt_values");
  return resp.data;
};

export { getPromptValues };
