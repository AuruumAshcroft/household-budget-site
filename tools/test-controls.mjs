// Uji kontrol DompetKeluarga di headless Chrome via CDP (WebSocket bawaan
// Node 22+). Menjalankan server lokal, membuka situs, lalu memeriksa:
// angka ringkasan, tambah transaksi (dashboard), filter cari, ubah anggaran,
// tambah dana tujuan, ganti rentang laporan, dan tidak ada error JS.
// Dijalankan dari root repo:  node tools/test-controls.mjs

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME =
  process.env.CHROME ??
  '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const root = resolve(fileURLToPath(new URL('../app', import.meta.url)));
const PORT = 8139;
const DEBUG_PORT = 9223;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = createServer((request, response) => {
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
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    response.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': stats.size,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end('not found');
  }
});
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${DEBUG_PORT}`,
  'about:blank',
]);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
}

try {
  // Tunggu DevTools siap.
  let version = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      version = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(500);
    }
  }
  if (!version) throw new Error('Chrome DevTools tidak menjawab');

  const tab = await (
    await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:${PORT}/`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    ws.onopen = done;
    ws.onerror = fail;
  });

  let nextId = 1;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails?.exception?.description ?? 'unknown error');
    }
  };
  function send(method, params = {}) {
    const id = nextId;
    nextId += 1;
    return new Promise((done) => {
      pending.set(id, done);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const reply = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (reply.result?.exceptionDetails) {
      throw new Error('evaluate gagal: ' + JSON.stringify(reply.result.exceptionDetails));
    }
    return reply.result?.result?.value;
  }
  async function navigate(hash) {
    await evaluate(`location.hash = '${hash}'; 'ok'`);
    await sleep(400);
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await sleep(1500);

  // 1. Angka ringkasan dashboard.
  const summary = await evaluate(
    `[...document.querySelectorAll('.stat-value')].map((el) => el.textContent).join(' | ')`,
  );
  check('ringkasan dashboard', summary.includes('Rp 12.500.000') && summary.includes('Rp 8.335.000') && summary.includes('Rp 4.165.000'), summary);

  // 2. Catat cepat: tambah pengeluaran Rp 50.000, total harus naik.
  await evaluate(`(() => {
    const form = document.getElementById('quick-form');
    form.desc.value = 'Tes Jajan Pasar';
    form.category.value = 'makanan';
    form.amount.value = '50000';
    form.date.value = '2026-11-26';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const afterAdd = await evaluate(`document.querySelectorAll('.stat-value')[1].textContent`);
  const storedCount = await evaluate(`JSON.parse(localStorage.getItem('dompetkeluarga.v1')).transactions.length`);
  check('tambah transaksi dashboard', afterAdd === 'Rp 8.385.000' && storedCount === 37, afterAdd + ' / ' + storedCount + ' baris');

  // 3. Filter cari "bensin" di halaman transaksi: 5 baris.
  await navigate('/transaksi');
  await evaluate(`(() => {
    const input = document.getElementById('filter-search');
    input.value = 'bensin';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);
  await sleep(200);
  const bensinRows = await evaluate(`document.querySelectorAll('#tx-body tr').length`);
  const countText = await evaluate(`document.getElementById('filter-count').textContent`);
  check('filter cari bensin', bensinRows === 5, countText);

  // 4. Ubah transaksi: edit baris pertama hasil filter (Bensin Motor 25 Nov).
  const editedId = await evaluate(`document.querySelector('#tx-body [data-edit]').dataset.edit`);
  await evaluate(`(() => {
    document.querySelector('#tx-body [data-edit]').click();
    const form = document.getElementById('tx-form');
    form.amount.value = '90000';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const editedAmount = await evaluate(
    `JSON.parse(localStorage.getItem('dompetkeluarga.v1')).transactions.find((row) => row.id === '${editedId}').amount`,
  );
  check('ubah transaksi', editedAmount === 90000, 'jumlah baru Rp ' + editedAmount);

  // 5. Ubah anggaran Makanan jadi Rp 3.000.000 -> 112% dan badge "Lewat batas".
  await navigate('/anggaran');
  await evaluate(`(() => {
    const form = document.querySelector('.budget-form[data-category="makanan"]');
    form.limit.value = '3000000';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const budgetBadge = await evaluate(
    `document.querySelector('.budget-form[data-category="makanan"]').closest('.budget-card').querySelector('.badge').textContent`,
  );
  check('ubah anggaran makanan', budgetBadge === 'Lewat batas', budgetBadge);

  // 6. Tambah dana Rp 100.000 ke Dana Darurat.
  await navigate('/tujuan');
  await evaluate(`(() => {
    const form = document.querySelector('.goal-form[data-goal="g01"]');
    form.amount.value = '100000';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const goalText = await evaluate(
    `document.querySelector('.goal-form[data-goal="g01"]').closest('.goal-card').querySelector('.budget-numbers').textContent`,
  );
  check('tambah dana tujuan', goalText.includes('Rp 12.500.000'), goalText.trim());

  // 7. Laporan: ganti rentang ke 3 bulan -> 3 baris tabel.
  await navigate('/laporan');
  await evaluate(`(() => {
    const select = document.getElementById('report-range');
    select.value = '3';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const reportRows = await evaluate(`document.querySelectorAll('#report-body tr').length`);
  check('laporan rentang 3 bulan', reportRows === 3, reportRows + ' baris');

  // 8. Buat tujuan baru.
  await navigate('/tujuan');
  await evaluate(`(() => {
    const form = document.getElementById('goal-form');
    form.name.value = 'Tes Dana Liburan';
    form.target.value = '5000000';
    form.note.value = 'Tes saja';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return 'ok';
  })()`);
  await sleep(300);
  const goalCount = await evaluate(`JSON.parse(localStorage.getItem('dompetkeluarga.v1')).goals.length`);
  check('tambah tujuan baru', goalCount === 5, goalCount + ' tujuan');

  // 9. Tidak ada exception JS selama pengujian.
  check('tanpa error JS', exceptions.length === 0, exceptions.join(' | '));

  ws.close();
} catch (error) {
  console.log('ERROR ' + error.message);
  failures += 1;
} finally {
  chrome.kill();
  server.close();
}

console.log(failures === 0 ? 'SEMUA UJI LULUS' : failures + ' UJI GAGAL');
process.exit(failures === 0 ? 0 : 1);
