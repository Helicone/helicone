import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("User list");
});

router.get("/:id", (req, res) => {
  res.send(`User ${req.params.id}`);
});

export default router;
