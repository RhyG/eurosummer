import type { MiddlewareHandler } from 'hono';
import { env } from './env.js';

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || token !== env.authToken) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
};
