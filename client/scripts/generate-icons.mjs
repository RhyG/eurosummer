import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'public/favicon.svg');
const outDir = path.join(root, 'public/icons');

await fs.mkdir(outDir, { recursive: true });
const svg = await fs.readFile(src);

async function render(size, name, opts = {}) {
  const bg = opts.background ?? { r: 247, g: 241, b: 229, alpha: 1 };
  const pad = opts.maskable ? Math.round(size * 0.18) : 0;
  const inner = size - pad * 2;

  const fg = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: fg, top: pad, left: pad }])
    .png()
    .toFile(path.join(outDir, name));
  console.log(`wrote ${name}`);
}

await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'icon-maskable-512.png', {
  maskable: true,
  background: { r: 198, g: 93, b: 58, alpha: 1 },
});
