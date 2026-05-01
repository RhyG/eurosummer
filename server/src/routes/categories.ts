import { Hono } from 'hono';
import { addCategory, listCategories } from '../store.js';
import { normalizeCategoryName } from '../categories.js';

export const categoryRoutes = new Hono();

categoryRoutes.get('/', async (c) => {
  const categories = await listCategories();
  return c.json({ categories });
});

categoryRoutes.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'invalid_category' }, 400);
  }
  const raw = (body as Record<string, unknown>).category;
  if (typeof raw !== 'string') return c.json({ error: 'invalid_category' }, 400);
  const category = normalizeCategoryName(raw);
  if (!category) return c.json({ error: 'invalid_category' }, 400);
  const categories = await addCategory(category);
  return c.json({ categories }, 201);
});
