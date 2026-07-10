import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server";

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!appPromise) {
    appPromise = createApp({ apiOnly: true });
  }
  const app = await appPromise;
  return app(req, res);
}
