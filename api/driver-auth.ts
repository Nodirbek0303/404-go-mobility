import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleDriverAuthLogin, handleDriverAuthMe } from "../lib/api/platformHandlers";

function toExpress(req: VercelRequest) {
  return { ...req, params: {}, query: req.query, body: req.body } as Parameters<typeof handleDriverAuthLogin>[0];
}

function toRes(res: VercelResponse) {
  return {
    status(code: number) {
      res.status(code);
      return this;
    },
    json(body: unknown) {
      res.json(body);
    },
  } as Parameters<typeof handleDriverAuthLogin>[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const action = req.query.action as string | undefined;
    const expressReq = toExpress(req);
    const expressRes = toRes(res);

    if (req.method === "POST" && action === "login") {
      return handleDriverAuthLogin(expressReq, expressRes);
    }
    if (req.method === "GET" && action === "me") {
      return handleDriverAuthMe(expressReq, expressRes);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Server error" });
  }
}
