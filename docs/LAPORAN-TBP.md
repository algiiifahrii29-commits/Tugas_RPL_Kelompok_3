# Laporan Tugas Team-Based Project: Praktik Pipeline CI

**Mata kuliah:** Rekayasa Perangkat Lunak (Pertemuan 13 & 14 – Pemeliharaan Perangkat Lunak & DevOps)
**Proyek:** SIPSTOK Quality Distro – Sistem Informasi Pengelolaan Stok Barang pada Toko Baju
**Kelompok:** [Kelompok 3]
**Repository:** https://github.com/USERNAME/sipstok-quality-distro

## 1. Siapkan

Repository proyek berisi prototipe SIPSTOK (HTML/CSS/JavaScript). Agar perintah build/test dapat berjalan secara lokal dan di CI,
dilakukan perubahan berikut:

- Logika bisnis (validasi keranjang, validasi stok masuk, status stok, hak akses menu, format Rupiah) dipisahkan dari DOM ke `js/logic.js`, lalu dipakai oleh `js/app.js`.
- Ditambahkan `package.json` dan `package-lock.json` dengan script `lint`, `build`, `test`, dan `ci`.
- Ditambahkan 13 unit test pada `tests/logic.test.js` (`node:test`, tanpa dependensi tambahan).

Bukti perintah berjalan lokal: `npm ci && npm run lint && npm run build && npm test` → 13 test lulus (`docs/log-run-sukses.txt`).

## 2. Otomasikan

Workflow `.github/workflows/ci.yml` berjalan pada **push** dan **pull request**, dengan langkah:
checkout → setup Node 22 → `npm ci` → `npm run lint` → `npm run build` → `npm test` → upload artefak `dist/`.
Rincian ada di [README](../README.md).

## 3. Buktikan

| Run | Commit | Hasil | Keterangan |
|-----|--------|-------|------------|
| #1 | `feat(ci): tambah pipeline GitHub Actions, modul logic.js, dan unit test` | **Gagal** | Test nomor 6 gagal |
| #2 | `fix: izinkan pembelian sama dengan stok tersedia (off-by-one pada validateCartAdd)` | **Sukses** | 13/13 test lulus |

Tautan/screenshot run (isi setelah push):
- Run gagal: [tempel URL run #1]
- Run sukses: [tempel URL run #2]

## 4. Ringkasan error dan langkah perbaikan

**Gejala.** Langkah *Automated test* gagal dengan pesan:

```
not ok 6 - validateCartAdd: jumlah tepat sama dengan stok diperbolehkan
  error: Expected values to be strictly equal: false !== true
  expected: true
  actual: false
```

**Penyebab.** Pada `validateCartAdd` (`js/logic.js`) kondisi penolakan ditulis `existing + qty >= product.stok`
(seharusnya `>`). Akibatnya kasir tidak bisa menjual unit terakhir: barang bersetok 10 ditolak saat dibeli 10.

**Dampak.** Barang tidak bisa dijual habis; stok minimum 1 unit selalu tertahan.

**Perbaikan.**
1. Baca log pada langkah gagal di tab Actions dan temukan test nomor 6.
2. Jalankan `npm test` lokal untuk mereproduksi masalah.
3. Ubah `>=` menjadi `>` pada `validateCartAdd`.
4. Jalankan ulang `npm test` (13/13 lulus), commit, dan push.
5. Pastikan run berikutnya di GitHub Actions berwarna hijau.

**Klasifikasi pemeliharaan.** *Corrective maintenance* (memperbaiki bug yang teridentifikasi). Test regresi tetap ada di
`tests/logic.test.js` sebagai *preventive* agar bug yang sama tidak muncul lagi.

## 5. Pembagian peran

| Anggota | NIM | Peran | Tugas |
|---------|-----|-------|-------|
| [Nama 1] | [NIM] | Ketua / DevOps | Menulis workflow CI, mengelola repository |
| [Nama 2] | [NIM] | Developer | Refactor `logic.js`, memperbaiki bug |
| [Nama 3] | [NIM] | QA | Menulis unit test, mendokumentasikan run |
| [Nama 4] | [NIM] | Dokumentasi | README, laporan |

## 6. Kesimpulan

Pipeline CI otomatis memeriksa setiap perubahan sehingga bug off-by-one terdeteksi sebelum digabung ke `main`,
sesuai prinsip alur perubahan terkendali: catat isu, analisis akar masalah, perbaiki, uji, dan catat hasil.
