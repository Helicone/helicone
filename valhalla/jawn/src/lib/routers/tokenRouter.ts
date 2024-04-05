import express from "express";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "../tokens/tokenCounter";

export const tokenRouter = express.Router();

tokenRouter.use(express.json());

tokenRouter.post("/v1/tokens/anthropic", async (req, res) => {
  const body = req.body;
  const content = body?.content;
  if (content === undefined) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const tokens = await getTokenCountAnthropic(content ?? "");
  res.json({ tokens });
});

tokenRouter.post("/v1/tokens/gpt3", async (req, res) => {
  const body = req.body;
  const content = body?.content;
  if (content === undefined) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  const tokens = await getTokenCountGPT3(content ?? "");
  res.json({ tokens });
});
