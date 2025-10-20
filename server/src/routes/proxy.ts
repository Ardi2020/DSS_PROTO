import { Router } from "express";
import axios from "axios";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";

dotenv.config();
const router = Router();

const BASE_URL = process.env.DSS_SMILE_BASE_URL;
if (!BASE_URL) throw new Error("DSS_SMILE_BASE_URL is required");

/**
 * Proxy GET/POST/PUT/PATCH/DELETE ke DSS-SMILE.
 * Path setelah /api/ diteruskan apa adanya.
 * Contoh: GET /api/facilities -> {BASE}/facilities
 * Auth sudah dicek di middleware level route (/api)
 */
async function proxyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const targetPath = req.path.replace(/^\/+/, ""); // remove leading slash
    const method = req.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";

    // Config untuk axios
    const config = {
      method: method as any,
      url: `/${targetPath}`,
      baseURL: BASE_URL,
      params: req.query,
      headers: {
        ...req.headers,
        host: undefined, // buang host forward
        cookie: undefined, // jangan forward cookie session
      },
      validateStatus: () => true, // jangan throw error otomatis
    } as any;

    // Request body untuk methods yang perlu
    if (['post', 'put', 'patch'].includes(method)) {
      config.data = req.body;
    }

    const upstream = await axios(config);
    res.status(upstream.status).set(upstream.headers).send(upstream.data);
  } catch (err: any) {
    // Normalisasi error agar gampang dibaca frontend
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json({
        ok: false,
        status: err.response.status,
        url: err.config?.url,
        data: err.response.data,
      });
    } else {
      next(err);
    }
  }
}

router.all("/*", proxyHandler);

export default router;
