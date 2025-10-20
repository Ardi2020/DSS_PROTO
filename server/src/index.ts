import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { proxy } from './proxy/router';
import { login, logout } from './auth/controller';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.get('/healthz', (_req, res) => res.json({ ok:true, ts: Date.now() }));
app.post('/auth/login', login);
app.post('/auth/logout', logout);
app.use('/proxy', proxy);

app.listen(Number(process.env.PORT||3001), () => {
  console.log(`Gateway up on http://localhost:${process.env.PORT||3001}`);
});
