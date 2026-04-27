import type { MiddlewareHandler } from 'hono';
import { env } from './env.js';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Fallback for <img> / direct GETs that can't set headers.
  const queryToken = c.req.query('token') ?? '';
  const token = headerToken || queryToken;
  if (!token || token !== env.authToken) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
};
