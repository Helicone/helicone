import axios from "axios";

const getFeedback = async () => {
    console.log("HI GET FEEDBACK")
  const resp = await axios.get("/api/feedback");
  console.log("HOOK HI", resp)
  return resp.data.data;
};

export { getFeedback };
