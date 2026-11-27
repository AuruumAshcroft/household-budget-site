// Router dan titik masuk DompetKeluarga: membaca hash (#/, #/transaksi,
// #/anggaran, #/tujuan, #/laporan), merender halaman dari views.js,
// memasang kontrolnya, dan menandai tautan navigasi yang aktif.

import {
  renderDashboard,
  renderTransactions,
  renderBudgets,
  renderGoals,
  renderReports,
  mountDashboard,
  mountTransactions,
  mountBudgets,
  mountGoals,
  mountReports,
} from './views.js';

const ROUTES = {
  '/': { render: renderDashboard, mount: mountDashboard },
  '/transaksi': { render: renderTransactions, mount: mountTransactions },
  '/anggaran': { render: renderBudgets, mount: mountBudgets },
  '/tujuan': { render: renderGoals, mount: mountGoals },
  '/laporan': { render: renderReports, mount: mountReports },
};

const viewRoot = document.getElementById('view');
const navLinks = [...document.querySelectorAll('.nav a')];

function currentPath() {
  const hash = window.location.hash || '#/';
  const path = hash.slice(1) || '/';
  return ROUTES[path] ? path : '/';
}

// Render ulang halaman yang sedang dibuka (dipanggil setelah data berubah).
export function rerender() {
  renderRoute();
}

function renderRoute() {
  const path = currentPath();
  const route = ROUTES[path];
  viewRoot.innerHTML = route.render();
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.route === path);
    if (link.dataset.route === path) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  route.mount(rerender);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
