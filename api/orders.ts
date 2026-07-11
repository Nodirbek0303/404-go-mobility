import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleOrderCancel,
  handleOrderCreate,
  handleOrderDispatch,
  handleOrderGet,
  handleOrderPatch,
  handleOrdersList,
} from "../lib/api/platformHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id as string | undefined;
    const action = req.query.action as string | undefined;
    const expressReq = { ...req, params: { id: id || "" }, query: req.query, body: req.body } as unknown as Parameters<typeof handleOrdersList>[0];
    const expressRes = {
      status(code: number) {
        res.status(code);
        return expressRes;
      },
      json(body: unknown) {
        res.json(body);
      },
    } as Parameters<typeof handleOrdersList>[1];

    if (req.method === "GET" && !id) return handleOrdersList(expressReq, expressRes);
    if (req.method === "POST" && !id) return handleOrderCreate(expressReq, expressRes);
    if (req.method === "GET" && id) return handleOrderGet(expressReq, expressRes);
    if (req.method === "PATCH" && id) return handleOrderPatch(expressReq, expressRes);
    if (req.method === "POST" && id && action === "dispatch") return handleOrderDispatch(expressReq, expressRes);
    if (req.method === "POST" && id && action === "cancel") return handleOrderCancel(expressReq, expressRes);

    res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Server error" });
  }
}
