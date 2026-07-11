import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleDriverAccept,
  handleDriverGet,
  handleDriverLocation,
  handleDriverStatus,
  handleDriversList,
} from "../lib/api/platformHandlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id as string | undefined;
    const action = req.query.action as string | undefined;
    const expressReq = { ...req, params: { id: id || "" }, query: req.query, body: req.body } as unknown as Parameters<typeof handleDriversList>[0];
    const expressRes = {
      status(code: number) {
        res.status(code);
        return expressRes;
      },
      json(body: unknown) {
        res.json(body);
      },
    } as Parameters<typeof handleDriversList>[1];

    if (req.method === "GET" && !id) return handleDriversList(expressReq, expressRes);
    if (req.method === "GET" && id) return handleDriverGet(expressReq, expressRes);
    if (req.method === "POST" && id && action === "status") return handleDriverStatus(expressReq, expressRes);
    if (req.method === "POST" && id && action === "accept") return handleDriverAccept(expressReq, expressRes);
    if (req.method === "POST" && id && action === "location") return handleDriverLocation(expressReq, expressRes);

    res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Server error" });
  }
}
