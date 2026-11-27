// Format angka dan tanggal untuk tampilan (rupiah, tanggal Indonesia).

// Rp 12.500.000 — tanpa desimal, pemisah ribuan titik.
export function formatRupiah(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// Bentuk singkat untuk label grafik: Rp 12,5 jt / Rp 850 rb.
export function formatRupiahShort(amount) {
  const n = Number(amount);
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + ' rb';
  return 'Rp ' + n;
}

// '2026-11-05' -> '5 Nov 2026'.
export function formatTanggal(isoDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  return Number(parts[2]) + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0];
}

// Persen terpakai dari anggaran, dibulatkan.
export function formatPersen(used, limit) {
  if (!limit) return 0;
  return Math.round((used / limit) * 100);
}

// Escape teks pengguna sebelum dimasukkan ke HTML (hindari tag liar).
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
