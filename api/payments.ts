import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handlePaymentConfirm,
  handlePaymentCreate,
  handlePaymentConfig,
} from "../lib/api/platformHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const action = req.query.action as string | undefined;
    const expressReq = { ...req, params: {}, query: req.query, body: req.body } as unknown as Parameters<typeof handlePaymentCreate>[0];
    const expressRes = {
      status(code: number) {
        res.status(code);
        return expressRes;
      },
      json(body: unknown) {
        res.json(body);
      },
    } as Parameters<typeof handlePaymentCreate>[1];

    if (req.method === "GET" && action === "config") return handlePaymentConfig(expressReq, expressRes);
    if (req.method === "POST" && action === "create") return handlePaymentCreate(expressReq, expressRes);
    if (req.method === "POST" && action === "confirm") return handlePaymentConfirm(expressReq, expressRes);

    res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Server error" });
  }
}
