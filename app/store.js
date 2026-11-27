// Satu-satunya sumber data situs. State dimuat dari localStorage
// (kunci di bawah) atau dari SEED di data.js bila belum ada; setiap
// perubahan disimpan kembali, lalu semua halaman menghitung ulang
// dari state yang sama — jadi angka selalu konsisten antar halaman.

import { SEED } from './data.js';

const STORAGE_KEY = 'dompetkeluarga.v1';

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets)) return parsed;
    }
  } catch {
    // localStorage rusak / tidak tersedia: pakai data awal.
  }
  return cloneSeed();
}

export const store = {
  state: loadState(),

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Penyimpanan penuh atau diblokir: situs tetap jalan di memori.
    }
  },

  resetToSeed() {
    this.state = cloneSeed();
    this.save();
  },

  // ---- Hitungan turunan (dipakai semua halaman) ----
  totalIncome() {
    return this.state.income.reduce((sum, row) => sum + row.amount, 0);
  },

  totalExpense() {
    return this.state.transactions.reduce((sum, row) => sum + row.amount, 0);
  },

  remaining() {
    return this.totalIncome() - this.totalExpense();
  },

  spentByCategory(categoryId) {
    return this.state.transactions
      .filter((row) => row.category === categoryId)
      .reduce((sum, row) => sum + row.amount, 0);
  },

  budgetFor(categoryId) {
    const found = this.state.budgets.find((row) => row.category === categoryId);
    return found ? found.limit : 0;
  },

  totalSaved() {
    return this.state.goals.reduce((sum, goal) => sum + goal.saved, 0);
  },

  monthlySeries() {
    // 6 bulan untuk laporan: 5 bulan riwayat + bulan ini dari transaksi.
    const series = this.state.history.map((row) => ({ ...row }));
    series.push({
      month: 'Nov 2026',
      income: this.totalIncome(),
      expense: this.totalExpense(),
    });
    return series;
  },

  // ---- Ubah data ----
  addTransaction(entry) {
    const id = 't' + Date.now().toString(36);
    this.state.transactions.push({ id, ...entry });
    this.state.transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    this.save();
    return id;
  },

  updateTransaction(id, entry) {
    const row = this.state.transactions.find((item) => item.id === id);
    if (!row) return false;
    Object.assign(row, entry);
    this.state.transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    this.save();
    return true;
  },

  deleteTransaction(id) {
    const before = this.state.transactions.length;
    this.state.transactions = this.state.transactions.filter((item) => item.id !== id);
    if (this.state.transactions.length !== before) {
      this.save();
      return true;
    }
    return false;
  },

  setBudget(categoryId, limit) {
    const row = this.state.budgets.find((item) => item.category === categoryId);
    if (row) row.limit = limit;
    else this.state.budgets.push({ category: categoryId, limit });
    this.save();
  },

  addToGoal(goalId, amount) {
    const goal = this.state.goals.find((item) => item.id === goalId);
    if (!goal || amount <= 0) return false;
    goal.saved = Math.min(goal.target, goal.saved + amount);
    this.save();
    return true;
  },

  addGoal(goal) {
    const id = 'g' + Date.now().toString(36);
    this.state.goals.push({ id, saved: 0, ...goal });
    this.save();
    return id;
  },
};
