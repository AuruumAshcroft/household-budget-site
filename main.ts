// Program penyerahan entri DompetKeluarga (Node 22, stdlib saja).
// Situsnya file statis di app/ (tanpa build step, tanpa request jaringan).
// Program ini menyalin app/ dan screenshots/ dari samping file ini ke
// /output, lalu menulis /output/dossier.json memakai library make.fun
// yang sudah di-vendor (vendor/makefun-frontend.ts, jangan diubah).
// Di luar container penilai, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Hitung file yang diserahkan, untuk ringkasan di akhir.
function countFiles(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log(
  `DompetKeluarga handed in: ${countFiles(join(out, 'app'))} app files, ` +
  `${readdirSync(join(out, 'screenshots')).length} screenshots -> ${out}`,
);
