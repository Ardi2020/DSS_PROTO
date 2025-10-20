import { Router } from "express";

const router = Router();

// Placeholder untuk DSS routes - bisa ditambahkan evaluasi rules, dll
router.get("/status", (req, res) => {
  res.json({ ok: true, service: "DSS Engine", user: req.user });
});

export default router;
