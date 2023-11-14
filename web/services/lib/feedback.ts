import axios from "axios";

const getFeedback = async () => {
  const resp = await axios.get("/api/feedback");
  return resp.data.data;
};

const getJoinClause = (query: string) => {
  if (query.toLowerCase().includes("feedback")) {
    return "LEFT JOIN feedback FINAL ON response_copy_v3.request_id = feedback.request_id";
  } else {
    return "";
  }
};

export { getFeedback, getJoinClause };
