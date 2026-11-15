# SIPSTOK QUALITY DISTRO QUALITY DISTRO — Sistem Informasi Pengelolaan Stok Barang pada Toko Baju

## Menjalankan aplikasi
1. Ekstrak folder ZIP.
2. Buka `index.html` melalui browser (Chrome/Edge/Firefox).
3. Masuk menggunakan akun demo:
   - Admin: `admin` / `admin123`
   - Kasir: `kasir` / `kasir123`
   - Pemilik: `pemilik` / `owner123`

## Modul
- Login dan pembatasan menu berdasarkan role.
- Dashboard jumlah barang, total stok, penjualan hari ini, dan peringatan stok minimum.
- CRUD data barang, kategori, supplier, dan pengguna.
- Pencatatan barang masuk berdasarkan nomor faktur dan supplier.
- Transaksi penjualan, validasi ketersediaan stok, pengurangan stok otomatis, dan tampilan struk.
- Riwayat stok masuk/keluar.
- Laporan penjualan berdasarkan periode dan posisi stok; dapat dicetak.

## Catatan implementasi
Ini adalah prototipe front-end HTML/CSS/JavaScript. Data disimpan pada `localStorage` browser sehingga cocok untuk demonstrasi dan pengujian antarmuka. Belum ada server, MySQL, sinkronisasi multi-perangkat, autentikasi aman berbasis hash, atau backup server. Struktur data JavaScript mengikuti entitas pada ERD, tetapi belum menggantikan implementasi tabel relasional fisik pada laporan. Untuk penerapan sebenarnya, hubungkan antarmuka ini ke backend (misalnya PHP/Node.js) dan MySQL/MariaDB serta terapkan hash password, validasi server, transaksi database, dan backup berkala.
