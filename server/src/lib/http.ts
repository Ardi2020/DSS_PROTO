import axios from 'axios';
export const http = axios.create({ baseURL: process.env.API_BASE, timeout: 10000 });

export async function withRetry<T>(fn: () => Promise<T>) {
  const max = Number(process.env.RETRY_MAX_ATTEMPTS || 5);
  const base = Number(process.env.RETRY_BASE_MS || 300);
  const cap  = Number(process.env.RETRY_MAX_MS || 5000);
  let last: any;
  for (let i=1;i<=max;i++){
    try { return await fn(); } catch (e:any){
      last = e; const s = e?.response?.status;
      const retriable = !s || s>=500 || s===429;
      if(!retriable || i===max) break;
      const d = Math.min(cap, base * 2**(i-1)) + Math.floor(Math.random()*100);
      await new Promise(r=>setTimeout(r,d));
    }
  } throw last;
}
