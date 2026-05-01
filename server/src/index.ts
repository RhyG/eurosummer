import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { requireAuth } from './auth.js';
import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { categoryRoutes } from './routes/categories.js';
import { placeRoutes } from './routes/places.js';
import { searchRoutes } from './routes/search.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, env.clientDist);

const app = new Hono();

app.get('/healthz', (c) => c.text('ok'));

app.route('/api/auth', authRoutes);

const apiAuthed = new Hono();
apiAuthed.use('*', requireAuth);
apiAuthed.get('/config', (c) =>
  c.json({ maptilerKey: env.maptilerKey || null }),
);
apiAuthed.route('/places', placeRoutes);
apiAuthed.route('/categories', categoryRoutes);
apiAuthed.route('/search', searchRoutes);
app.route('/api', apiAuthed);

app.use(
  '/*',
  serveStatic({
    root: path.relative(process.cwd(), clientDist),
    rewriteRequestPath: (p) => p,
  }),
);

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: 'not_found' }, 404);
  }
  try {
    const indexHtml = await fs.readFile(
      path.join(clientDist, 'index.html'),
      'utf8',
    );
    return c.html(indexHtml);
  } catch {
    return c.text('Client build not found. Run `npm run build`.', 500);
  }
});

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`eatlist server listening on :${info.port}`);
});
