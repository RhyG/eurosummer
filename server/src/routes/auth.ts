import { Hono } from 'hono';
import { env } from '../env.js';

export const authRoutes = new Hono();

authRoutes.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const password =
    body && typeof body === 'object' && 'password' in body
      ? String((body as { password: unknown }).password ?? '')
      : '';
  if (password !== env.authPassword) {
    return c.json({ error: 'invalid_password' }, 401);
  }
  return c.json({ token: env.authToken });
});
