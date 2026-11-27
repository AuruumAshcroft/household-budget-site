// Data awal DompetKeluarga: contoh nyata satu rumah tangga Indonesia
// (Keluarga Hartono, 4 anggota) untuk bulan November 2026. Semua angka
// dalam rupiah. File ini hanya berisi data; logika baca/tulis ada di store.js.

export const CATEGORIES = [
  { id: 'makanan', label: 'Makanan & Belanja', color: '#d97706' },
  { id: 'transportasi', label: 'Transportasi', color: '#2563eb' },
  { id: 'tagihan', label: 'Tagihan & Utilitas', color: '#7c3aed' },
  { id: 'pendidikan', label: 'Pendidikan', color: '#0891b2' },
  { id: 'kesehatan', label: 'Kesehatan', color: '#dc2626' },
  { id: 'rumah', label: 'Rumah Tangga', color: '#65a30d' },
  { id: 'hiburan', label: 'Hiburan', color: '#db2777' },
  { id: 'tabungan', label: 'Tabungan', color: '#059669' },
];

export const SEED = {
  household: { name: 'Keluarga Hartono', members: 4, monthLabel: 'November 2026' },
  // Pemasukan bulan ini (3 sumber, total Rp 12.500.000)
  income: [
    { id: 'i01', date: '2026-11-01', desc: 'Gaji Bulanan (Bapak)', amount: 9500000 },
    { id: 'i02', date: '2026-11-15', desc: 'Usaha Katering Sampingan', amount: 2300000 },
    { id: 'i03', date: '2026-11-20', desc: 'Bonus Proyek Lepas', amount: 700000 },
  ],
  // Pengeluaran bulan ini: 36 baris nyata (total Rp 8.335.000)
  transactions: [
    { id: 't01', date: '2026-11-01', desc: 'Belanja Bulanan Superindo', category: 'makanan', amount: 1250000 },
    { id: 't02', date: '2026-11-01', desc: 'Token Listrik PLN', category: 'tagihan', amount: 425000 },
    { id: 't03', date: '2026-11-02', desc: 'Bensin Motor', category: 'transportasi', amount: 85000 },
    { id: 't04', date: '2026-11-02', desc: 'Sayur & Lauk Pasar Pagi', category: 'makanan', amount: 145000 },
    { id: 't05', date: '2026-11-03', desc: 'SPP Anak (SD)', category: 'pendidikan', amount: 650000 },
    { id: 't06', date: '2026-11-03', desc: 'Makan Siang Keluarga', category: 'makanan', amount: 120000 },
    { id: 't07', date: '2026-11-04', desc: 'Internet & TV Kabel', category: 'tagihan', amount: 385000 },
    { id: 't08', date: '2026-11-05', desc: 'Bensin Mobil', category: 'transportasi', amount: 250000 },
    { id: 't09', date: '2026-11-05', desc: 'Jajan Anak Sekolah', category: 'pendidikan', amount: 75000 },
    { id: 't10', date: '2026-11-06', desc: 'Belanja Mingguan Pasar', category: 'makanan', amount: 320000 },
    { id: 't11', date: '2026-11-07', desc: 'Obat & Vitamin', category: 'kesehatan', amount: 180000 },
    { id: 't12', date: '2026-11-07', desc: 'Cuci Motor', category: 'transportasi', amount: 25000 },
    { id: 't13', date: '2026-11-08', desc: 'Air PAM', category: 'tagihan', amount: 165000 },
    { id: 't14', date: '2026-11-08', desc: 'Beras 10 kg', category: 'makanan', amount: 145000 },
    { id: 't15', date: '2026-11-09', desc: 'Les Bahasa Inggris Anak', category: 'pendidikan', amount: 400000 },
    { id: 't16', date: '2026-11-10', desc: 'Pulsa & Paket Data', category: 'tagihan', amount: 150000 },
    { id: 't17', date: '2026-11-10', desc: 'Makan Malam di Luar', category: 'makanan', amount: 210000 },
    { id: 't18', date: '2026-11-11', desc: 'Servis Motor Rutin', category: 'transportasi', amount: 175000 },
    { id: 't19', date: '2026-11-12', desc: 'Sabun & Deterjen', category: 'rumah', amount: 135000 },
    { id: 't20', date: '2026-11-12', desc: 'Nonton Bioskop Keluarga', category: 'hiburan', amount: 200000 },
    { id: 't21', date: '2026-11-13', desc: 'Belanja Mingguan Pasar', category: 'makanan', amount: 285000 },
    { id: 't22', date: '2026-11-14', desc: 'Iuran RT & Keamanan', category: 'rumah', amount: 100000 },
    { id: 't23', date: '2026-11-15', desc: 'Periksa Gigi Anak', category: 'kesehatan', amount: 250000 },
    { id: 't24', date: '2026-11-15', desc: 'Bensin Motor', category: 'transportasi', amount: 85000 },
    { id: 't25', date: '2026-11-16', desc: 'Buku & Alat Tulis', category: 'pendidikan', amount: 190000 },
    { id: 't26', date: '2026-11-17', desc: 'Langganan Streaming', category: 'hiburan', amount: 65000 },
    { id: 't27', date: '2026-11-18', desc: 'Belanja Mingguan Pasar', category: 'makanan', amount: 310000 },
    { id: 't28', date: '2026-11-19', desc: 'Galon Air Minum', category: 'rumah', amount: 55000 },
    { id: 't29', date: '2026-11-20', desc: 'Makan Siang Keluarga', category: 'makanan', amount: 135000 },
    { id: 't30', date: '2026-11-21', desc: 'Bensin Mobil', category: 'transportasi', amount: 250000 },
    { id: 't31', date: '2026-11-22', desc: 'Gas LPG 12 kg', category: 'rumah', amount: 165000 },
    { id: 't32', date: '2026-11-23', desc: 'Sayur & Lauk Pasar Pagi', category: 'makanan', amount: 155000 },
    { id: 't33', date: '2026-11-24', desc: 'Iuran Arisan Keluarga', category: 'rumah', amount: 300000 },
    { id: 't34', date: '2026-11-25', desc: 'Bensin Motor', category: 'transportasi', amount: 85000 },
    { id: 't35', date: '2026-11-25', desc: 'Vitamin & Suplemen', category: 'kesehatan', amount: 120000 },
    { id: 't36', date: '2026-11-26', desc: 'Belanja Mingguan Pasar', category: 'makanan', amount: 295000 },
  ],
  // Anggaran per kategori (total Rp 9.200.000)
  budgets: [
    { category: 'makanan', limit: 3600000 },
    { category: 'transportasi', limit: 1100000 },
    { category: 'tagihan', limit: 1200000 },
    { category: 'pendidikan', limit: 1400000 },
    { category: 'kesehatan', limit: 600000 },
    { category: 'rumah', limit: 900000 },
    { category: 'hiburan', limit: 400000 },
  ],
  // Tujuan tabungan
  goals: [
    { id: 'g01', name: 'Dana Darurat', target: 20000000, saved: 12400000, note: 'Setara 2 bulan pengeluaran — target aman 6 bulan.' },
    { id: 'g02', name: 'Liburan Keluarga ke Yogyakarta', target: 8000000, saved: 3250000, note: 'Berangkat libur sekolah Juni 2027.' },
    { id: 'g03', name: 'Renovasi Dapur', target: 15000000, saved: 5600000, note: 'Ganti kompor, wastafel, dan cat ulang.' },
    { id: 'g04', name: 'Motor Baru', target: 18000000, saved: 2100000, note: 'Ganti motor lama yang sering mogok.' },
  ],
  // Riwayat 5 bulan sebelumnya (Nov 2026 dihitung langsung dari transaksi)
  history: [
    { month: 'Jun 2026', income: 12100000, expense: 9050000 },
    { month: 'Jul 2026', income: 12400000, expense: 9620000 },
    { month: 'Agu 2026', income: 12500000, expense: 8980000 },
    { month: 'Sep 2026', income: 12300000, expense: 9310000 },
    { month: 'Okt 2026', income: 12600000, expense: 9840000 },
  ],
  // Target tabungan bulanan yang disisihkan dari sisa
  monthlySaving: 2000000,
};

// Tips hemat yang tampil di dashboard — ditulis untuk keluarga Indonesia.
export const TIPS = [
  {
    title: 'Belanja pasar 2x seminggu, bukan tiap hari',
    body: 'Belanja harian bikin jajan tak terencana ikut masuk keranjang. Keluarga Hartono belanja Rp 285–320 ribu per kunjungan — catat daftar sebelum berangkat dan patuhi.',
  },
  {
    title: 'Token listrik naik? Cek AC dan dispenser',
    body: 'Tagihan listrik bulan ini Rp 425 ribu. Matikan dispenser malam hari dan setel AC 25°C: hematnya bisa Rp 50–80 ribu per bulan.',
  },
  {
    title: 'Sisa Rp 4,1 juta — sisihkan tabungan dulu',
    body: 'Begitu gajian masuk, pindahkan Rp 2 juta ke rekening tabungan terpisah sebelum belanja. Yang tidak terlihat, tidak terbelanjakan.',
  },
];
