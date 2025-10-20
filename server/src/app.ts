import dotenv from "dotenv";
dotenv.config(); // Must be called before route imports

import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";

import authRoute from "./routes/auth.js";
import proxyRoute from "./routes/proxy.js";
import dssRoute from "./routes/dss.js";
import { requireAuth } from "./middlewares/auth.js";

const app = express();
const logger = pino({ transport: { target: "pino-pretty" } });

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());

const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
app.use(cors({ origin, credentials: true }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "DSS_PROTO" }));

// Auth publik (login/logout/me/create user admin)
app.use("/auth", authRoute);

// Semua endpoint di bawah ini WAJIB login
app.use("/api", requireAuth, proxyRoute);
app.use("/dss", requireAuth, dssRoute);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.status || 500;
  res.status(status).json({
    ok: false,
    status,
    message: err?.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
  });
});

const PORT = Number(process.env.PORT ?? 5175);
app.listen(PORT, () => {
  console.log(`Server up at http://localhost:${PORT}`);
});
