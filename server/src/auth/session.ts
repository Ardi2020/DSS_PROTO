type TokenBundle = { accessToken: string; expiresAt: number };
const store = new Map<string, TokenBundle>();
export const Session = {
  create(sid: string, t: TokenBundle){ store.set(sid, t); },
  get(sid: string){ return store.get(sid); },
  set(sid: string, t: TokenBundle){ store.set(sid, t); },
  drop(sid: string){ store.delete(sid); }
};
