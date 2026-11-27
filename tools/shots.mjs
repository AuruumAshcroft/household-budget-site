// Alat bantu dev (bukan bagian dari entri): menyajikan app/ secara lokal
// lalu mengambil screenshot asli situs dengan headless Chrome dan
// menyimpannya sebagai JPEG ke screenshots/. Dijalankan dari root repo:
//   node tools/shots.mjs

import { createServer } from 'node:http';
import { createReadStream, statSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const CHROME =
  process.env.CHROME ??
  '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const root = resolve(fileURLToPath(new URL('../app', import.meta.url)));
const shotsDir = resolve(fileURLToPath(new URL('../screenshots', import.meta.url)));
const PORT = 8137;

// file, hash route, viewport — urutan nama menentukan cover (1-* pertama).
const SHOTS = [
  { file: '1-dashboard.jpg', path: '#/', width: 1280, height: 800 },
  { file: '2-transaksi.jpg', path: '#/transaksi', width: 1280, height: 800 },
  { file: '3-anggaran.jpg', path: '#/anggaran', width: 1280, height: 800 },
  { file: '4-dashboard-phone.jpg', path: '#/', width: 390, height: 844 },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function serveFile(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}

const server = createServer(serveFile);
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));
console.log(`serving app/ on http://127.0.0.1:${PORT}`);

mkdirSync(shotsDir, { recursive: true });
try {
  for (const shot of SHOTS) {
    const pngPath = join(shotsDir, shot.file.replace(/\.jpg$/, '.tmp.png'));
    const jpgPath = join(shotsDir, shot.file);
    const url = `http://127.0.0.1:${PORT}/${shot.path}`;
    await run(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--window-size=${shot.width},${shot.height}`,
      '--virtual-time-budget=5000',
      `--screenshot=${pngPath}`,
      url,
    ]);
    await run('ffmpeg', ['-y', '-v', 'error', '-i', pngPath, '-q:v', '5', jpgPath]);
    unlinkSync(pngPath);
    const bytes = statSync(jpgPath).size;
    console.log(`${shot.file}: ${shot.width}x${shot.height} ${bytes} bytes${bytes > 262144 ? ' — OVER 256 KiB!' : ''}`);
  }
} finally {
  server.close();
}
