# SIPSTOK Quality Distro

[![CI](https://github.com/USERNAME/sipstok-quality-distro/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/sipstok-quality-distro/actions/workflows/ci.yml)

Sistem Informasi Pengelolaan Stok Barang pada Toko Baju (prototipe front-end HTML/CSS/JavaScript).
Proyek ini dipakai pada **Tugas Team-Based Project (TBP) – Praktik Pipeline CI**, mata kuliah Rekayasa Perangkat Lunak
(Pertemuan 13 & 14: Pemeliharaan Perangkat Lunak & DevOps).

> Panduan penggunaan aplikasi (akun demo, modul) ada di [README.app.md](README.app.md).

## Cara menjalankan CI

Pipeline didefinisikan di [`.github/workflows/ci.yml`](.github/workflows/ci.yml) dan berjalan otomatis di **GitHub Actions**:

| Event | Kondisi |
|-------|---------|
| `push` | ke branch mana pun |
| `pull_request` | yang menuju `main` |

Alur (mengikuti materi "Pipeline CI"): **Push/PR → Checkout → Install dependensi → Build/Lint → Automated test**

| Langkah | Perintah | Keterangan |
|---------|----------|------------|
| Checkout | `actions/checkout@v6` | Mengambil kode pada runner `ubuntu-latest` |
| Setup Node | `actions/setup-node@v6` (Node 22) | Dengan cache npm |
| Install dependensi | `npm ci` | Mengikuti `package-lock.json` |
| Lint | `npm run lint` | Cek sintaks JS, referensi berkas `index.html`, larangan `debugger` |
| Build | `npm run build` | Menyalin aplikasi ke `dist/` |
| Test | `npm test` | 13 unit test (`node:test`) pada `js/logic.js` |
| Artefak | `actions/upload-artifact@v4` | Menyimpan `dist/` jika semua langkah sukses |

## Menjalankan di komputer lokal

Prasyarat: Node.js 20+ (disarankan 22).

```bash
npm ci          # install dependensi (proyek ini tidak punya dependensi runtime)
npm run lint    # lint
npm run build   # build ke dist/
npm test        # unit test
npm run ci      # ketiganya sekaligus
```

## Melihat hasil run

1. Buka tab **Actions** pada repository GitHub.
2. Pilih workflow **CI**, lalu klik salah satu run.
3. Centang hijau = semua langkah lulus; silang merah = ada langkah gagal (klik langkah untuk melihat log).

## Struktur proyek

```
.github/workflows/ci.yml   Workflow GitHub Actions
js/logic.js                Logika bisnis murni (diuji CI)
js/app.js                  UI aplikasi (memakai logic.js)
tests/logic.test.js        Unit test
scripts/lint.js, build.js  Script lint dan build tanpa dependensi
docs/                      Laporan TBP, log run gagal dan sukses
```

## Dokumentasi tugas

- [Laporan TBP (ringkasan error, langkah perbaikan, pembagian peran)](docs/LAPORAN-TBP.md)
- [Log lokal run gagal](docs/log-run-gagal.txt) dan [run sukses](docs/log-run-sukses.txt)
