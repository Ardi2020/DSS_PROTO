import { Router } from "express";
import { findUser, verifyPassword, createUser, changePassword } from "../services/userStore.js";
import { signSession, setSessionCookie, clearSessionCookie, requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

/** POST /auth/login { username, password } */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) return res.status(400).json({ ok: false, message: "username & password required" });

    const user = await findUser(username);
    if (!user || !user.active) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = signSession({ sub: user.id, username: user.username, role: user.role, permissions: user.permissions });
    setSessionCookie(res, token);

    res.json({ ok: true, user: { username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/logout */
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

/** GET /auth/me */
router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

/** POST /auth/users  (admin create user) */
router.post("/users", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { username, password, role, permissions } = req.body ?? {};
    if (!username || !password) return res.status(400).json({ ok: false, message: "username & password required" });
    const user = await createUser({ username, password, role, permissions });
    res.status(201).json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/change-password  (self-service) */
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body ?? {};
    if (!newPassword) return res.status(400).json({ ok: false, message: "newPassword required" });
    await changePassword(req.user!.username, newPassword);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
