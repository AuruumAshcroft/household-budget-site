// Grafik canvas buatan sendiri (tanpa library): donat pembagian
// pengeluaran per kategori dan batang pemasukan vs pengeluaran.
// Semua gambar digambar dari angka state — bukan gambar statis.

import { formatRupiahShort } from './format.js';

// Siapkan canvas tajam di layar retina: ukuran internal dikali devicePixelRatio.
function prepareCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

// Donat: slices = [{ label, value, color }]. Tengah donat menampilkan total.
export function drawDonut(canvas, slices, totalLabel) {
  const { ctx, width, height } = prepareCanvas(canvas);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada pengeluaran', width / 2, height / 2);
    return;
  }
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.min(width, height) / 2 - 8;
  const inner = outer * 0.62;
  let angle = -Math.PI / 2;
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.arc(cx, cy, inner, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep;
  }
  ctx.fillStyle = '#14532d';
  ctx.font = '700 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(formatRupiahShort(total), cx, cy - 2);
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(totalLabel, cx, cy + 18);
}

// Batang berkelompok: series = [{ month, income, expense }].
// Batang hijau = pemasukan, batang oranye = pengeluaran.
export function drawIncomeExpenseBars(canvas, series) {
  const { ctx, width, height } = prepareCanvas(canvas);
  const padLeft = 64;
  const padRight = 8;
  const padTop = 18;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const maxValue = Math.max(...series.flatMap((row) => [row.income, row.expense]), 1);
  const top = Math.ceil(maxValue / 5000000) * 5000000;

  ctx.strokeStyle = '#e5e7eb';
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  for (let step = 0; step <= 2; step += 1) {
    const value = (top * step) / 2;
    const y = padTop + plotHeight - (plotHeight * step) / 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.fillText(formatRupiahShort(value), padLeft - 8, y + 4);
  }

  const groupWidth = plotWidth / series.length;
  const barWidth = Math.min(26, (groupWidth - 16) / 2);
  ctx.textAlign = 'center';
  series.forEach((row, index) => {
    const groupX = padLeft + index * groupWidth;
    const centerX = groupX + groupWidth / 2;
    const incomeHeight = (row.income / top) * plotHeight;
    const expenseHeight = (row.expense / top) * plotHeight;
    ctx.fillStyle = '#059669';
    ctx.fillRect(centerX - barWidth - 2, padTop + plotHeight - incomeHeight, barWidth, incomeHeight);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(centerX + 2, padTop + plotHeight - expenseHeight, barWidth, expenseHeight);
    ctx.fillStyle = '#374151';
    ctx.fillText(row.month, centerX, height - 8);
  });
}
