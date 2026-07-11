import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleRoute } from "../lib/api/platformHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressReq = { ...req, params: {}, query: req.query, body: req.body } as unknown as Parameters<typeof handleRoute>[0];
    const expressRes = {
      status(code: number) {
        res.status(code);
        return expressRes;
      },
      json(body: unknown) {
        res.json(body);
      },
    } as Parameters<typeof handleRoute>[1];

    if (req.method === "GET") return handleRoute(expressReq, expressRes);
    res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Server error" });
  }
}
