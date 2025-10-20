import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { http, withRetry } from '../lib/http';
import { Session } from './session';
import { setSidCookie } from './cookie';

export async function login(req: Request, res: Response){
  const { username, password } = req.body;
  const r = await withRetry(() => http.post('/login', { username, password }));
  const payload = r.data?.response || r.data;
  const token = payload?.access_token || payload?.token;
  const expires = Number(payload?.expires_in || 3600);
  if(!token) return res.status(401).json({ status:false, keterangan:'login-gagal' });

  const sid = crypto.randomUUID();
  Session.create(sid, { accessToken: token, expiresAt: Date.now() + expires*1000 });
  setSidCookie(res, sid, expires);
  res.json({ status:true, keterangan:'Logged in' });
}

export async function logout(_req: Request, res: Response){
  try { await http.post('/logout'); } catch {}
  const sid = _req.cookies?.sid; if(sid) Session.drop(sid);
  res.clearCookie('sid'); res.json({ status:true, keterangan:'Logged out' });
}
