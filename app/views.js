// Halaman-halaman DompetKeluarga. Setiap render menghasilkan HTML dari
// state (store.js); setiap mount memasang semua kontrol halaman itu
// (form, filter, tombol) supaya benar-benar berfungsi.

import { CATEGORIES, TIPS } from './data.js';
import { store } from './store.js';
import { formatRupiah, formatRupiahShort, formatTanggal, formatPersen, escapeHtml } from './format.js';
import { drawDonut, drawIncomeExpenseBars } from './charts.js';

export function categoryLabel(id) {
  const found = CATEGORIES.find((item) => item.id === id);
  return found ? found.label : id;
}

export function categoryColor(id) {
  const found = CATEGORIES.find((item) => item.id === id);
  return found ? found.color : '#6b7280';
}

// Pesan konfirmasi sekali tampil: ditulis sebelum render ulang, dibaca
// saat render, lalu dibersihkan di mount supaya tidak muncul lagi.
let quickMessage = '';
let goalMessage = '';

function dot(color) {
  return `<span class="dot" style="background:${color}"></span>`;
}

function progressBar(percent, over) {
  const width = Math.min(100, percent);
  return `<div class="bar"><div class="bar-fill${over ? ' over' : ''}" style="width:${width}%"></div></div>`;
}

function summaryCards() {
  const income = store.totalIncome();
  const expense = store.totalExpense();
  const left = store.remaining();
  const saved = store.state.monthlySaving;
  return `
  <section class="cards" aria-label="Ringkasan bulan ini">
    <div class="card stat"><span class="stat-label">Pemasukan</span><strong class="stat-value income">${formatRupiah(income)}</strong><span class="stat-note">3 sumber penghasilan</span></div>
    <div class="card stat"><span class="stat-label">Pengeluaran</span><strong class="stat-value expense">${formatRupiah(expense)}</strong><span class="stat-note">36 transaksi tercatat</span></div>
    <div class="card stat"><span class="stat-label">Sisa Uang</span><strong class="stat-value">${formatRupiah(left)}</strong><span class="stat-note">dari pemasukan bulan ini</span></div>
    <div class="card stat"><span class="stat-label">Ditabung Bulan Ini</span><strong class="stat-value saving">${formatRupiah(saved)}</strong><span class="stat-note">total di semua tujuan: ${formatRupiah(store.totalSaved())}</span></div>
  </section>`;
}

// ---------------- Dashboard ----------------

export function renderDashboard() {
  const byCategory = CATEGORIES.filter((cat) => cat.id !== 'tabungan')
    .map((cat) => ({ label: cat.label, value: store.spentByCategory(cat.id), color: cat.color }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
  const latest = [...store.state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const topBudgets = store.state.budgets
    .map((row) => ({ ...row, spent: store.spentByCategory(row.category) }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 3);
  const tips = TIPS.map(
    (tip) => `<article class="tip"><h3>${escapeHtml(tip.title)}</h3><p>${escapeHtml(tip.body)}</p></article>`,
  ).join('');

  return `
  <h1>Dashboard — ${escapeHtml(store.state.household.monthLabel)}</h1>
  <p class="lede">${escapeHtml(store.state.household.name)} · ${store.state.household.members} anggota keluarga · Semua angka di bawah ini dihitung dari transaksi yang tercatat.</p>
  ${summaryCards()}
  <div class="grid-2">
    <section class="card">
      <h2>Pengeluaran per Kategori</h2>
      <canvas id="donut" class="chart donut" aria-label="Grafik donat pengeluaran per kategori"></canvas>
      <ul class="legend">${byCategory
        .map((slice) => `<li>${dot(slice.color)} ${escapeHtml(slice.label)} <strong>${formatRupiah(slice.value)}</strong></li>`)
        .join('')}</ul>
    </section>
    <section class="card">
      <h2>Anggaran Paling Ketat</h2>
      ${topBudgets
        .map((row) => {
          const percent = formatPersen(row.spent, row.limit);
          return `<div class="budget-line"><div class="budget-line-head"><span>${dot(categoryColor(row.category))} ${escapeHtml(categoryLabel(row.category))}</span><strong>${percent}%</strong></div>${progressBar(percent, percent > 100)}<p class="muted">${formatRupiah(row.spent)} dari ${formatRupiah(row.limit)}</p></div>`;
        })
        .join('')}
      <p><a class="button" href="#/anggaran">Atur semua anggaran →</a></p>
    </section>
  </div>
  <section class="card">
    <h2>Transaksi Terbaru</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th class="num">Jumlah</th></tr></thead>
      <tbody>${latest
        .map((row) => `<tr><td>${formatTanggal(row.date)}</td><td>${escapeHtml(row.desc)}</td><td>${dot(categoryColor(row.category))} ${escapeHtml(categoryLabel(row.category))}</td><td class="num">${formatRupiah(row.amount)}</td></tr>`)
        .join('')}</tbody>
    </table></div>
    <p><a class="button" href="#/transaksi">Lihat semua transaksi →</a></p>
  </section>
  <div class="grid-2">
    <section class="card">
      <h2>Catat Cepat</h2>
      <p class="muted">Tambah pengeluaran baru tanpa pindah halaman.</p>
      <form id="quick-form" class="form">
        <label>Deskripsi<input name="desc" required maxlength="80" placeholder="cth. Belanja sayur sore"></label>
        <label>Kategori<select name="category">${CATEGORIES.filter((cat) => cat.id !== 'tabungan').map((cat) => `<option value="${cat.id}">${escapeHtml(cat.label)}</option>`).join('')}</select></label>
        <label>Jumlah (Rp)<input name="amount" type="number" min="1000" step="500" required placeholder="50000"></label>
        <label>Tanggal<input name="date" type="date" value="2026-11-26" required></label>
        <button class="button primary" type="submit">Simpan Transaksi</button>
        <p class="form-msg" id="quick-msg" role="status">${escapeHtml(quickMessage)}</p>
      </form>
    </section>
    <section class="card">
      <h2>Tips Hemat Minggu Ini</h2>
      ${tips}
      <p><button class="button" id="reset-data" type="button">Kembalikan data contoh</button></p>
    </section>
  </div>`;
}

export function mountDashboard(onChange) {
  const slices = CATEGORIES.filter((cat) => cat.id !== 'tabungan')
    .map((cat) => ({ label: cat.label, value: store.spentByCategory(cat.id), color: cat.color }));
  drawDonut(document.getElementById('donut'), slices, 'total keluar');
  document.getElementById('quick-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const amount = Number(form.amount.value);
    if (!form.desc.value.trim() || !(amount > 0)) return;
    store.addTransaction({
      date: form.date.value || '2026-11-26',
      desc: form.desc.value.trim(),
      category: form.category.value,
      amount,
    });
    quickMessage = 'Tersimpan: ' + form.desc.value.trim() + ' — ' + formatRupiah(amount) + '.';
    onChange();
  });
  document.getElementById('reset-data').addEventListener('click', () => {
    store.resetToSeed();
    onChange();
  });
  quickMessage = '';
}

// ---------------- Transaksi ----------------

function combinedRows() {
  const income = store.state.income.map((row) => ({ ...row, category: null, kind: 'masuk' }));
  const expense = store.state.transactions.map((row) => ({ ...row, kind: 'keluar' }));
  return [...income, ...expense].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function renderTransactions() {
  return `
  <h1>Transaksi</h1>
  <p class="lede">Semua pemasukan dan pengeluaran ${escapeHtml(store.state.household.monthLabel)} — ${store.state.transactions.length + store.state.income.length} baris. Cari, saring, ubah, atau hapus.</p>
  <section class="card">
    <div class="filters">
      <label>Cari<input id="filter-search" type="search" placeholder="cth. pasar, listrik, bensin"></label>
      <label>Kategori<select id="filter-category"><option value="">Semua kategori</option>${CATEGORIES.filter((cat) => cat.id !== 'tabungan').map((cat) => `<option value="${cat.id}">${escapeHtml(cat.label)}</option>`).join('')}</select></label>
      <label>Jenis<select id="filter-kind"><option value="">Semua</option><option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option></select></label>
    </div>
    <p class="muted" id="filter-count" role="status"></p>
    <div class="table-wrap"><table>
      <thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Jenis</th><th class="num">Jumlah</th><th>Aksi</th></tr></thead>
      <tbody id="tx-body"></tbody>
    </table></div>
  </section>
  <section class="card">
    <h2 id="tx-form-title">Tambah Transaksi</h2>
    <form id="tx-form" class="form form-grid">
      <input type="hidden" name="id" value="">
      <label>Deskripsi<input name="desc" required maxlength="80" placeholder="cth. Belanja mingguan pasar"></label>
      <label>Kategori<select name="category">${CATEGORIES.filter((cat) => cat.id !== 'tabungan').map((cat) => `<option value="${cat.id}">${escapeHtml(cat.label)}</option>`).join('')}</select></label>
      <label>Jumlah (Rp)<input name="amount" type="number" min="1000" step="500" required placeholder="100000"></label>
      <label>Tanggal<input name="date" type="date" value="2026-11-26" required></label>
      <button class="button primary" type="submit" id="tx-submit">Tambah Transaksi</button>
      <button class="button" type="button" id="tx-cancel" hidden>Batalkan Ubahan</button>
      <p class="form-msg" id="tx-msg" role="status"></p>
    </form>
  </section>`;
}

function renderTransactionRows() {
  const search = document.getElementById('filter-search').value.trim().toLowerCase();
  const category = document.getElementById('filter-category').value;
  const kind = document.getElementById('filter-kind').value;
  const rows = combinedRows().filter((row) => {
    if (search && !row.desc.toLowerCase().includes(search)) return false;
    if (category && row.category !== category) return false;
    if (kind && row.kind !== kind) return false;
    return true;
  });
  document.getElementById('filter-count').textContent =
    'Menampilkan ' + rows.length + ' dari ' + combinedRows().length + ' transaksi.';
  document.getElementById('tx-body').innerHTML = rows
    .map((row) => {
      const catCell = row.category
        ? `${dot(categoryColor(row.category))} ${escapeHtml(categoryLabel(row.category))}`
        : '—';
      const actions = row.kind === 'keluar'
        ? `<button class="link-btn" type="button" data-edit="${row.id}">Ubah</button> <button class="link-btn danger" type="button" data-delete="${row.id}">Hapus</button>`
        : '<span class="muted">tetap</span>';
      return `<tr><td>${formatTanggal(row.date)}</td><td>${escapeHtml(row.desc)}</td><td>${catCell}</td><td>${row.kind === 'masuk' ? 'Masuk' : 'Keluar'}</td><td class="num ${row.kind}">${row.kind === 'masuk' ? '+' : '−'} ${formatRupiah(row.amount)}</td><td>${actions}</td></tr>`;
    })
    .join('');
}

export function mountTransactions(onChange) {
  const form = document.getElementById('tx-form');
  const applyFilters = () => renderTransactionRows();
  ['filter-search', 'filter-category', 'filter-kind'].forEach((id) => {
    document.getElementById(id).addEventListener('input', applyFilters);
  });
  renderTransactionRows();

  document.getElementById('tx-body').addEventListener('click', (event) => {
    const target = event.target;
    if (target.dataset.delete) {
      const row = store.state.transactions.find((item) => item.id === target.dataset.delete);
      if (row && window.confirm('Hapus transaksi "' + row.desc + '" (' + formatRupiah(row.amount) + ')?')) {
        store.deleteTransaction(target.dataset.delete);
        onChange();
      }
      return;
    }
    if (target.dataset.edit) {
      const row = store.state.transactions.find((item) => item.id === target.dataset.edit);
      if (!row) return;
      form.id.value = row.id;
      form.desc.value = row.desc;
      form.category.value = row.category;
      form.amount.value = row.amount;
      form.date.value = row.date;
      document.getElementById('tx-form-title').textContent = 'Ubah Transaksi';
      document.getElementById('tx-submit').textContent = 'Simpan Perubahan';
      document.getElementById('tx-cancel').hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.getElementById('tx-cancel').addEventListener('click', () => {
    form.reset();
    form.id.value = '';
    document.getElementById('tx-form-title').textContent = 'Tambah Transaksi';
    document.getElementById('tx-submit').textContent = 'Tambah Transaksi';
    document.getElementById('tx-cancel').hidden = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(form.amount.value);
    if (!form.desc.value.trim() || !(amount > 0)) return;
    const entry = {
      date: form.date.value || '2026-11-26',
      desc: form.desc.value.trim(),
      category: form.category.value,
      amount,
    };
    if (form.id.value) {
      store.updateTransaction(form.id.value, entry);
      document.getElementById('tx-msg').textContent = 'Perubahan tersimpan.';
    } else {
      store.addTransaction(entry);
      document.getElementById('tx-msg').textContent = 'Transaksi baru tersimpan: ' + entry.desc + ' — ' + formatRupiah(amount) + '.';
    }
    // Perbarui tabel tanpa membangun ulang form, supaya pesan konfirmasi tetap terlihat.
    form.reset();
    form.id.value = '';
    document.getElementById('tx-form-title').textContent = 'Tambah Transaksi';
    document.getElementById('tx-submit').textContent = 'Tambah Transaksi';
    document.getElementById('tx-cancel').hidden = true;
    renderTransactionRows();
  });
}

// ---------------- Anggaran ----------------

export function renderBudgets() {
  const totalLimit = store.state.budgets.reduce((sum, row) => sum + row.limit, 0);
  const totalSpent = store.totalExpense();
  const totalPercent = formatPersen(totalSpent, totalLimit);
  const cards = store.state.budgets
    .map((row) => {
      const spent = store.spentByCategory(row.category);
      const percent = formatPersen(spent, row.limit);
      const left = row.limit - spent;
      const status = percent > 100 ? 'Lewat batas' : percent >= 80 ? 'Hampir habis' : 'Aman';
      return `<article class="card budget-card">
        <div class="budget-head"><h3>${dot(categoryColor(row.category))} ${escapeHtml(categoryLabel(row.category))}</h3><span class="badge${percent > 100 ? ' over' : percent >= 80 ? ' warn' : ''}">${status}</span></div>
        <p class="budget-numbers"><strong>${formatRupiah(spent)}</strong> dari ${formatRupiah(row.limit)} · ${percent}%</p>
        ${progressBar(percent, percent > 100)}
        <p class="muted">${left >= 0 ? 'Sisa ' + formatRupiah(left) : 'Lebih ' + formatRupiah(-left) + ' dari anggaran'}</p>
        <form class="budget-form" data-category="${row.category}">
          <label>Anggaran baru (Rp)<input type="number" name="limit" min="0" step="50000" value="${row.limit}" required></label>
          <button class="button" type="submit">Simpan Anggaran</button>
        </form>
      </article>`;
    })
    .join('');

  return `
  <h1>Anggaran Bulanan</h1>
  <p class="lede">Atur batas belanja tiap kategori untuk ${escapeHtml(store.state.household.monthLabel)}. Total anggaran ${formatRupiah(totalLimit)}; terpakai ${formatRupiah(totalSpent)} (${totalPercent}%). Ubah angka lalu tekan Simpan — progress bar langsung ikut berubah.</p>
  <section class="card total-strip"><strong>Total terpakai ${formatRupiah(totalSpent)} dari ${formatRupiah(totalLimit)}</strong>${progressBar(totalPercent, totalPercent > 100)}<p class="muted">Saran umum: makanan 30%, tagihan 10%, transportasi 10% dari pemasukan. Anggaran keluarga ini: makanan ${formatPersen(store.spentByCategory('makanan'), store.totalIncome())}% dari pemasukan.</p></section>
  <div class="grid-2">${cards}</div>`;
}

export function mountBudgets(onChange) {
  document.querySelectorAll('.budget-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const limit = Number(form.limit.value);
      if (!(limit >= 0)) return;
      store.setBudget(form.dataset.category, limit);
      onChange();
    });
  });
}

// ---------------- Tujuan ----------------

export function renderGoals() {
  const totalTarget = store.state.goals.reduce((sum, goal) => sum + goal.target, 0);
  const cards = store.state.goals
    .map((goal) => {
      const percent = formatPersen(goal.saved, goal.target);
      return `<article class="card goal-card">
        <h3>${escapeHtml(goal.name)}</h3>
        <p class="muted">${escapeHtml(goal.note)}</p>
        <p class="budget-numbers"><strong>${formatRupiah(goal.saved)}</strong> dari ${formatRupiah(goal.target)} · ${percent}%</p>
        ${progressBar(percent, false)}
        <p class="muted">Kurang ${formatRupiah(Math.max(0, goal.target - goal.saved))} lagi</p>
        <form class="goal-form" data-goal="${goal.id}">
          <label>Tambah dana (Rp)<input type="number" name="amount" min="10000" step="10000" placeholder="100000" required></label>
          <button class="button primary" type="submit">Tambah Dana</button>
        </form>
      </article>`;
    })
    .join('');

  return `
  <h1>Tujuan Tabungan</h1>
  <p class="lede">Total terkumpul ${formatRupiah(store.totalSaved())} dari target ${formatRupiah(totalTarget)}. Tambah dana kapan saja — progress dan total langsung berubah di semua halaman.</p>
  <div class="grid-2">${cards}</div>
  <section class="card">
    <h2>Buat Tujuan Baru</h2>
    <form id="goal-form" class="form form-grid">
      <label>Nama tujuan<input name="name" required maxlength="60" placeholder="cth. Dana Pendidikan Anak"></label>
      <label>Target (Rp)<input name="target" type="number" min="100000" step="100000" required placeholder="5000000"></label>
      <label>Catatan<input name="note" maxlength="120" placeholder="cth. Untuk masuk SMP tahun depan"></label>
      <button class="button primary" type="submit">Simpan Tujuan</button>
      <p class="form-msg" id="goal-msg" role="status">${escapeHtml(goalMessage)}</p>
    </form>
  </section>`;
}

export function mountGoals(onChange) {
  document.querySelectorAll('.goal-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const amount = Number(form.amount.value);
      if (!(amount > 0)) return;
      if (store.addToGoal(form.dataset.goal, amount)) onChange();
    });
  });
  document.getElementById('goal-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const target = Number(form.target.value);
    if (!form.name.value.trim() || !(target > 0)) return;
    store.addGoal({ name: form.name.value.trim(), target, note: form.note.value.trim() || 'Tujuan baru keluarga.' });
    goalMessage = 'Tujuan "' + form.name.value.trim() + '" tersimpan.';
    onChange();
  });
  goalMessage = '';
}

// ---------------- Laporan ----------------

export function renderReports() {
  const series = store.monthlySeries();
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  const savingRate = Math.round(((current.income - current.expense) / current.income) * 100);
  const expenseChange = Math.round(((current.expense - previous.expense) / previous.expense) * 100);
  const biggest = CATEGORIES.filter((cat) => cat.id !== 'tabungan')
    .map((cat) => ({ label: cat.label, value: store.spentByCategory(cat.id), color: cat.color }))
    .sort((a, b) => b.value - a.value)[0];
  const breakdown = CATEGORIES.filter((cat) => cat.id !== 'tabungan')
    .map((cat) => ({ label: cat.label, value: store.spentByCategory(cat.id), color: cat.color }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  return `
  <h1>Laporan Bulanan</h1>
  <p class="lede">Tren pemasukan dan pengeluaran 6 bulan terakhir, plus rangkuman ${escapeHtml(store.state.household.monthLabel)}.</p>
  <section class="card">
    <div class="report-head"><h2>Tren Pemasukan vs Pengeluaran</h2>
      <label>Rentang <select id="report-range"><option value="6">6 bulan</option><option value="3">3 bulan</option></select></label>
    </div>
    <canvas id="bars" class="chart bars" aria-label="Grafik batang pemasukan dan pengeluaran per bulan"></canvas>
    <p class="legend-inline"><span class="legend-swatch income"></span> Pemasukan &nbsp; <span class="legend-swatch expense"></span> Pengeluaran</p>
  </section>
  <section class="card">
    <h2>Rincian per Bulan</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>Bulan</th><th class="num">Pemasukan</th><th class="num">Pengeluaran</th><th class="num">Selisih</th><th class="num">Tingkat Tabung</th></tr></thead>
      <tbody id="report-body"></tbody>
    </table></div>
  </section>
  <div class="grid-2">
    <section class="card">
      <h2>Pengeluaran Terbesar — November</h2>
      <ul class="legend">${breakdown
        .map((row) => `<li>${dot(row.color)} ${escapeHtml(row.label)} <strong>${formatRupiah(row.value)}</strong> <span class="muted">(${formatPersen(row.value, store.totalExpense())}%)</span></li>`)
        .join('')}</ul>
    </section>
    <section class="card">
      <h2>Ringkasan &amp; Saran</h2>
      <p>Pengeluaran terbesar bulan ini adalah <strong>${escapeHtml(biggest.label)}</strong> (${formatRupiah(biggest.value)}). Tingkat tabung bulan ini <strong>${savingRate}%</strong> dari pemasukan — di atas patokan sehat 20%.</p>
      <p>Dibanding Oktober, pengeluaran ${expenseChange <= 0 ? 'turun' : 'naik'} ${Math.abs(expenseChange)}% (Oktober ${formatRupiah(previous.expense)} → November ${formatRupiah(current.expense)}). Rata-rata pengeluaran 6 bulan terakhir ${formatRupiah(Math.round(series.reduce((sum, row) => sum + row.expense, 0) / series.length))} per bulan.</p>
      <p>Saran: pertahankan belanja pasar 2x seminggu dan sisihkan tabungan di awal gajian — dua kebiasaan ini yang menjaga tingkat tabung di atas 30%.</p>
    </section>
  </div>`;
}

function renderReportTable(range) {
  const series = store.monthlySeries().slice(-range);
  document.getElementById('report-body').innerHTML = series
    .map((row) => {
      const diff = row.income - row.expense;
      const rate = Math.round((diff / row.income) * 100);
      return `<tr><td>${escapeHtml(row.month)}</td><td class="num">${formatRupiah(row.income)}</td><td class="num">${formatRupiah(row.expense)}</td><td class="num ${diff >= 0 ? 'income' : 'expense'}">${formatRupiah(diff)}</td><td class="num">${rate}%</td></tr>`;
    })
    .join('');
  drawIncomeExpenseBars(document.getElementById('bars'), series);
}

export function mountReports() {
  renderReportTable(6);
  document.getElementById('report-range').addEventListener('change', (event) => {
    renderReportTable(Number(event.target.value));
  });
}
