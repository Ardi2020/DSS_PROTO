import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'node:crypto';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

const API_BASE = process.env.API_BASE!;
const TOKEN_FALLBACK = Number(process.env.TOKEN_LIFETIME_FALLBACK_SEC || 3600);

// Sesi in-memory: sid -> {token, expiresAt}
type Ses = { token: string; expiresAt: number };
const SESS = new Map<string, Ses>();

function setSid(res: any, sid: string, maxAgeSec: number) {
  res.cookie('sid', sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: maxAgeSec * 1000,
    path: '/'
  });
}

app.get('/healthz', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// LOGIN → relay ke API /login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const r = await axios.post(`${API_BASE}/login`, { username, password }, { timeout: 10000 });
    const payload = r.data?.response || r.data;
    const token = payload?.access_token || payload?.token;
    const expiresIn = Number(payload?.expires_in || TOKEN_FALLBACK);
    if (!token) return res.status(401).json({ status:false, keterangan:'login-gagal' });

    const sid = crypto.randomUUID();
    const expiresAt = Date.now() + expiresIn * 1000;
    SESS.set(sid, { token, expiresAt });
    setSid(res, sid, expiresIn);
    return res.json({ status:true, keterangan:'Logged in' });
  } catch (e: any) {
    const s = e?.response?.status || 500;
    return res.status(s).json({ status:false, keterangan:'login-error', detail: s });
  }
});

// INFO SESI → untuk hitung mundur di Dashboard
app.get('/auth/session', (req, res) => {
  const sid = (req as any).cookies?.sid;
  const ses = sid ? SESS.get(sid) : undefined;
  if (!sid || !ses) return res.status(401).json({ status:false, keterangan:'no-session' });
  const now = Date.now();
  const remainingSec = Math.max(0, Math.floor((ses.expiresAt - now) / 1000));
  return res.json({ status:true, now, expiresAt: ses.expiresAt, remainingSec });
});

// LOGOUT
app.post('/auth/logout', (req, res) => {
  const sid = (req as any).cookies?.sid;
  if (sid) SESS.delete(sid);
  res.clearCookie('sid');
  return res.json({ status:true, keterangan:'Logged out' });
});

// PROXY → forward ke API upstream dengan Bearer
app.use('/proxy', async (req, res) => {
  const sid = (req as any).cookies?.sid;
  if (!sid) return res.status(401).json({ status:false, keterangan:'no-session' });
  const ses = SESS.get(sid);
  if (!ses) return res.status(401).json({ status:false, keterangan:'session-expired' });

  try {
    const upstream = await axios.request({
      baseURL: API_BASE,
      url: req.originalUrl.replace(/^\/proxy/, ''),
      method: req.method as any,
      data: req.body,
      headers: { Authorization: `Bearer ${ses.token}` },
      validateStatus: () => true,
      timeout: 15000
    });
    if (upstream.status === 401 || upstream.status === 419) {
      return res.status(401).json({ status:false, keterangan:'unauthorized' });
    }
    return res.status(upstream.status).json(upstream.data);
  } catch (e: any) {
    const s = e?.response?.status || 500;
    return res.status(s).json({ status:false, keterangan:'proxy-error', detail: s });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Gateway up at http://localhost:${PORT}`));
