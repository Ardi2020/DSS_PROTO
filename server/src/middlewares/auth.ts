import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const COOKIE_NAME = "dss_proto.sid";

export type AuthClaims = {
  sub: string;            // user id
  username: string;
  role: "admin" | "user";
  permissions?: string[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthClaims;
    }
  }
}

export function signSession(claims: AuthClaims) {
  const expiresIn = process.env.JWT_EXPIRES ?? "8h";
  return jwt.sign(claims, JWT_SECRET, { expiresIn });
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true kalau pakai https
    maxAge: 1000 * 60 * 60 * 8, // 8 jam
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ ok: false, message: "Unauthenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthClaims;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, message: "Unauthenticated" });
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    next();
  };
}
