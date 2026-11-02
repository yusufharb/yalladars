import type { IncomingMessage, ServerResponse } from 'http';
import { getApp } from '../server.ts';

let appPromise: Promise<any> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = getApp();
  }
  const app = await appPromise;

  // Ensure request URL matches the Express /api/... routes
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
