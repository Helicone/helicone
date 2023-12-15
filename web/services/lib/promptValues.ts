import axios from "axios";

const getPromptValues = async () => {
  const resp = await axios.get("/api/prompt_values");
  return resp.data;
};

export { getPromptValues };
