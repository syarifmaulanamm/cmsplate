# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan
[Semantic Versioning](https://semver.org/lang/id/).

## [1.0.0] — 2026-11-15

Rilis pertama. Boilerplate CMS siap produksi dengan dua bahasa, SEO bawaan,
analytics first-party, dan deploy Docker.

### Added

**Fondasi**
- Next.js 16.4.3 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS 4.3, shadcn/ui.
- Design system terpusat: token warna terakota, tipografi Geist + Newsreader, mode terang/gelap, komponen shadcn yang dimiliki repo.
- PostgreSQL 16 + Prisma 6, migrasi, seed idempoten, Docker Compose pengembangan.

**Autentikasi & keamanan**
- Sesi database dengan cookie `httpOnly`; database hanya menyimpan SHA-256 token.
- RBAC tiga peran (Super Admin, Editor, Author) dengan pemeriksaan di server.
- Rate limit login 5/menit/IP, upload 20/menit/user, analytics 60/menit/hash.
- CSP + HSTS di produksi, header keamanan lain, validasi upload, penolakan path traversal.

**Konten**
- Blog CRUD dengan empat halaman, revisi, autosave 20 detik, jadwal terbit, dan Sampah dengan pemulihan serta hapus permanen.
- Kategori CRUD hierarkis (maks. 3 level) dengan terjemahan per bahasa.
- Media manager: penyimpanan lokal, hash nama file, varian WebP otomatis, alt/caption, dialog pemilih dua tab.
- Editor Tiptap: heading, list, kutipan, link, gambar dari media picker, penghitung karakter.

**Dua bahasa**
- Routing `/id` dan `/en`, deteksi via cookie/`Accept-Language`, `<html lang>` dinamis.
- Kamus bertipe ID/EN dengan test paritas kunci.
- Konten artikel dan kategori memakai tabel terjemahan; slug dan status terbit per bahasa.
- Pemilih bahasa publik; bahasa admin disimpan per pengguna.
- `hreflang`, canonical, dan `x-default` per halaman.

**SEO**
- SEO meter 0–100 dengan checklist dan skor tersimpan.
- Editor OpenGraph dengan pratinjau kartu.
- Schema editor JSON-LD: template Article/FAQ/Breadcrumb, variabel `{{post.*}}`, validasi klien + server.
- `sitemap.xml` dinamis dengan alternates, `robots.txt`, JSON-LD `BlogPosting`.
- SEO monitor: audit on-site, skor kesehatan, filter tingkat, aksi abaikan yang bertahan antar audit.

**Analytics & integrasi**
- Collector first-party tanpa cookie, visitor hash harian, filter bot.
- Dashboard 7/30/90 hari: KPI, area chart, halaman teratas, sumber trafik, perangkat.
- Agregasi harian dan retensi lewat cron bertanda tangan secret.
- GTM, GA4, dan Google Ads dengan mode eksklusif; Consent Mode v2 default `denied` + banner persetujuan.

**Tambahan**
- Path panel admin dapat diubah lewat `ADMIN_PATH` (runtime, tanpa build ulang). `/admin` dan `/login` lama membalas 404 saat path diganti; login ikut pindah ke `<ADMIN_PATH>/login`. Nilai divalidasi (huruf kecil, tanda hubung, minimal 8 karakter untuk path kustom) dan tidak ditulis di `robots.txt`.
- Floating WhatsApp multi-nomor: normalisasi nomor, bobot pilih, jadwal online per zona waktu, mode tunggal/daftar, event `generate_lead`.
- Manajemen pengguna dengan proteksi Super Admin terakhir.
- Pengaturan situs (nama, tagline, meta default, zona waktu, artikel per halaman).
- Panduan deploy, backup/restore, checklist keamanan, dan CI.

### Changed

- Nama produk diubah dari **Simple CMS** menjadi **CMSPlate** di antarmuka, kamus ID/EN, pengaturan default, seed, dokumentasi, dan lisensi.
- Identitas teknis mengikuti nama baru: paket `cmsplate`, image dan container Docker `cmsplate`, cookie sesi `cmsplate_session`, key `localStorage` `cmsplate-*`, serta service health `cmsplate`. Nama database dan user PostgreSQL tetap `simplecms` agar tidak perlu migrasi data.
- Logo dan ikon resmi dari `docs/brands` dipasang di header publik, sidebar admin, halaman login, favicon, dan apple icon. Huruf "S" pengganti serta badge milestone "M0" di header publik dihapus.
- `README.md` disusun ulang: logo dengan varian gelap, badge, tabel fitur, perintah, rute, diagram arsitektur, dan tautan dokumentasi.
- Nama situs yang tersimpan di pengaturan ikut diperbarui bila masih memakai nama default lama.

### Fixed

- Filter `publishedAt` yang dievaluasi sekali saat modul dimuat membuat artikel baru 404 di publik.
- Tab bahasa di form melepas input bahasa non-aktif sehingga data tidak terkirim.
- `pickWeighted` menerima angka padahal pemanggil mengirim fungsi acak.
- Halaman Sampah tidak mengarahkan ulang setelah hapus permanen.
- `lib/users/actions.ts` memakai `server-only` alih-alih `use server` sehingga build gagal.
- Menu Artikel masih nonaktif di sidebar setelah fitur blog selesai.
- Prisma Client tidak tergenerate pada stage prod-deps sehingga container 500 di `/login`.
- Runtime container gagal karena corepack mencoba menulis cache sebagai user non-root.
- Dashboard admin menampilkan KPI placeholder dan daftar artikel kosong meski data tersedia; kini memakai data nyata (artikel terbit, kunjungan 7 hari, skor SEO, menunggu review, artikel terbaru, isu SEO).
- Tombol "Tulis artikel" di topbar masih nonaktif; kini langsung membuka editor.
- Item menu "Pengaturan akun" dan "Lupa password?" tampil nonaktif tanpa fungsi; diganti tautan nyata atau dihapus.
- Halaman publik masih menampilkan status "M0 — Fondasi"; diganti ajakan membaca artikel.
- Menu **Schema** di sidebar masih nonaktif tanpa halaman; kini menjadi halaman Schema global (Organization/WebSite/LocalBusiness) yang dirender di semua halaman publik.
- Tombol `+` di topbar hanya ikon tanpa label; kini berupa tombol berlabel "Tulis artikel" (ikon saja di layar kecil) yang membuka editor.
- Peringatan console "Encountered a script tag while rendering React component" akibat `next-themes`; provider tema diganti implementasi sendiri tanpa script di komponen, dengan anti-flash lewat script inline di root layout.

### Security

- Sanitasi HTML berlapis pada konten artikel.
- SVG dengan script/event handler ditolak saat upload.
- JSON-LD di-escape agar tidak bisa keluar dari tag `script`.
- Rahasia tidak pernah dikirim ke klien; `.env` dan `.env.production` diabaikan git serta Docker build.
