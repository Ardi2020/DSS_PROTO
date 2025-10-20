import type { Response } from 'express';
export function setSidCookie(res: Response, sid: string, maxAgeSec=3600){
  res.cookie('sid', sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: maxAgeSec * 1000,
    path: '/'
  });
}
