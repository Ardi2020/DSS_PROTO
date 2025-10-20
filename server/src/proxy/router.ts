import express from 'express';
import { http, withRetry } from '../lib/http';
import { Session } from '../auth/session';

export const proxy = express.Router();

proxy.use(async (req, res) => {
  const sid = req.cookies?.sid;
  if(!sid) return res.status(401).json({ status:false, keterangan:'no-session' });
  const ses = Session.get(sid);
  if(!ses) return res.status(401).json({ status:false, keterangan:'session-expired' });

  const upstream = await withRetry(() => http.request({
    method: req.method as any,
    url: req.originalUrl.replace(/^\/proxy/, ''),
    data: req.body,
    headers: { Authorization: `Bearer ${ses.accessToken}` },
    validateStatus: () => true
  }));

  // 401/419 → suruh UI login lagi
  if(upstream.status===401 || upstream.status===419){
    return res.status(401).json({ status:false, keterangan:'unauthorized' });
  }
  res.status(upstream.status).json(upstream.data);
});
