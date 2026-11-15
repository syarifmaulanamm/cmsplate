# Implementation Plan — CMSPlate

**Sumber:** `docs/PRD.md` v1.1
**Strategi:** vertical slice. Setiap fase menghasilkan alur yang bisa dipakai, bukan lapisan setengah jadi.
**Estimasi total:** ±8 minggu (1 developer)

**Status:** M0 selesai. Tambahan yang sudah berjalan: i18n dua bahasa, CRUD kategori, dan media manager (M1 sebagian).

## Status Implementasi

| Item | Status |
|---|---|
| M0 — Fondasi | ✅ Selesai |
| F-08 — Dua bahasa (UI + kategori) | ✅ Selesai |
| F-02 — Category CRUD (index/create/read/update + dialog hapus) | ✅ Selesai |
| F-03 — Media library + picker dialog dua tab | ✅ Selesai |
| F-01 — Blog CRUD (index/create/read/update + dialog hapus) | ✅ Selesai |
| Public blog, kategori, sitemap, hreflang | ✅ Selesai |
| A-03 — SEO meter (skor + checklist di editor) | ✅ Dasar selesai |
| Autosave 20 detik & halaman Sampah + pemulihan | ✅ Selesai |
| A-04 — OpenGraph editor + preview kartu | ✅ Selesai |
| A-05 — Schema editor (JSON-LD + variabel) | ✅ Selesai |
| F-04 — Analytics first-party + dashboard | ✅ Selesai |
| F-06 — GTM/GA4/Ads + Consent Mode | ✅ Selesai |
| A-06 — Floating WhatsApp multi-nomor + jadwal + round-robin | ✅ Selesai |
| F-07 — Manajemen pengguna + pengaturan situs | ✅ Selesai |
| F-05 — SEO monitor terjadwal + daftar isu | ✅ Selesai |
| M5 — Docker produksi, dokumentasi deploy, hardening | ✅ Selesai |
| F-04 s/d F-07 | ⏳ |

## Tambahan Pasca-M0

### T33 — Fondasi i18n
**Acceptance:** routing `/id` & `/en`, kamus bertipe, `html lang`, proxy, pemilih bahasa, bahasa admin per pengguna.
**Verify:** test paritas kunci kamus, E2E ganti bahasa.

### T34 — Category CRUD dengan terjemahan
**Acceptance:** `category_translations`, empat halaman, filter URL, dialog hapus dengan blokir.
**Verify:** E2E create → search → edit → delete; unit test slug.

### T35 — Media storage dan varian
**Acceptance:** adapter lokal, hash nama file, varian WebP, route penyajian immutable.
**Verify:** upload PNG di E2E, cek varian.

### T36 — Media library dan picker
**Acceptance:** halaman `/admin/media`, filter, edit alt/caption, hapus dengan dialog, picker dua tab.
**Verify:** E2E upload, picker tab, delete.

### T37 — Blog CRUD dan terjemahan artikel
**Acceptance:** `post_translations`, editor Tiptap, 4 halaman CRUD, filter URL, revisi, soft delete.
**Verify:** E2E create → publish → publik → delete; unit test skor SEO.

### T38 — Halaman publik dan SEO teknis
**Acceptance:** `/blog`, `/blog/[slug]`, `/kategori/[slug]`, `sitemap.xml` dengan alternates, `robots.txt`, JSON-LD, hreflang.
**Verify:** smoke HTTP status, E2E publik, sitemap memuat slug baru.


---

## Ringkasan Arsitektur

- Satu aplikasi Next.js 16.4.3 (App Router) yang menyajikan halaman publik dan panel admin.
- Server Components untuk baca, Server Actions untuk tulis, Route Handler untuk analytics, media, cron, dan OG.
- PostgreSQL + Prisma 7. Storage lokal di `/data/uploads` di balik `StorageAdapter`.
- Auth.js v5 (Credentials, sesi database) + RBAC tiga peran.
- Tailwind 4.3 CSS-first, token di `app/globals.css`, komponen shadcn/ui dimiliki di repo.

---

## Fase M0 — Fondasi

### T01 — Inisialisasi proyek dan konfigurasi
**Acceptance:**
- [ ] `package.json` mengunci `next@16.4.3`, `tailwindcss@4.3.5`, React 19.
- [ ] TypeScript strict, path alias `@/*`, ESLint flat config, Prettier.
- [ ] `.env.example` lengkap dan `lib/env.ts` memvalidasi env dengan Zod saat boot.
- [ ] `.gitignore` mengecualikan `.env`, `node_modules`, `.next`, `data/uploads`.

**Verify:** `pnpm typecheck` dan `pnpm lint` bersih.
**Size:** S · **Dep:** —

### T02 — Design foundation
**Acceptance:**
- [ ] `app/globals.css` berisi token dari `docs/design-tokens.css` (light + dark).
- [ ] Font Geist Sans, Geist Mono, dan Newsreader dimuat via `next/font`.
- [ ] `next-themes` berjalan; toggle terang/gelap tanpa flash.
- [ ] Komponen dasar shadcn tersedia: button, input, textarea, label, card, badge, separator, skeleton, sonner.

**Verify:** halaman contoh menampilkan semua varian tombol dan badge di kedua tema.
**Size:** M · **Dep:** T01

### T03 — Database dan Docker
**Acceptance:**
- [ ] `docker-compose.yml` menjalankan app + Postgres 16 dengan volume persisten.
- [ ] `prisma/schema.prisma` memuat seluruh model PRD Bagian 7.
- [ ] Migrasi awal diterapkan; `pnpm prisma migrate deploy` bersih di container baru.
- [ ] `prisma/seed.ts` membuat 1 Super Admin, 3 kategori, 2 artikel contoh.

**Verify:** `docker compose up -d db && pnpm prisma migrate dev && pnpm prisma db seed`.
**Size:** M · **Dep:** T01

### T04 — Auth, sesi, dan RBAC
**Acceptance:**
- [ ] Halaman `/login` dengan validasi Zod dan pesan error yang jelas.
- [ ] Sesi database; cookie `httpOnly`, `sameSite=lax`, `secure` di produksi.
- [ ] `requireRole()` di `lib/rbac.ts` dipakai di semua Server Action dan layout admin.
- [ ] Rate limit login 5 percobaan/menit per IP.
- [ ] Logout menghapus sesi; redirect ke `/login`.

**Verify:** unit test `rbac.test.ts`; manual login tiga peran.
**Size:** M · **Dep:** T02, T03

### T05 — Shell admin
**Acceptance:**
- [ ] Sidebar collapsible, topbar dengan breadcrumb, pencarian ⌘K, menu pengguna.
- [ ] Command palette mencari halaman admin dan artikel.
- [ ] Dashboard menampilkan KPI placeholder dengan skeleton tanpa layout shift.
- [ ] Guard: pengguna tanpa sesi diarahkan ke `/login`; Author tidak melihat menu Users/Settings.

**Verify:** E2E login → dashboard; axe tanpa pelanggaran serius.
**Size:** M · **Dep:** T04

### Checkpoint M0
- [ ] `pnpm build` sukses
- [ ] `docker compose up --build` menyajikan `/login` dan `/admin`
- [ ] Semua test hijau

---

## Fase M1 — Konten

### T06 — Skema dan validasi konten
**Acceptance:**
- [ ] Zod schema untuk post, category, tag, media di `lib/content/schemas.ts`.
- [ ] Helper `slugify` + pengecekan unik dengan suffix `-2`, `-3`.
- [ ] Unit test untuk slug dan validasi status.

**Size:** S · **Dep:** T03

### T07 — Category CRUD (vertical slice)
**Acceptance:**
- [ ] Halaman list, create, edit, delete di `/admin/categories`.
- [ ] Hierarki maksimal 3 level; siklus ditolak server.
- [ ] Hapus ditolak jika masih ada artikel/anak, dengan pesan jumlah terkait.
- [ ] Revalidasi cache setelah mutasi.

**Verify:** integrasi test Server Action; E2E buat kategori.
**Size:** M · **Dep:** T05, T06

### T08 — Media storage adapter
**Acceptance:**
- [ ] Interface `StorageAdapter` (`put`, `get`, `delete`, `url`) di `lib/media/storage.ts`.
- [ ] Implementasi `LocalStorage` menulis ke `UPLOAD_DIR` di luar `public/`.
- [ ] Route Handler `/api/media/[...path]` menyajikan file dengan cache immutable dan proteksi path traversal.
- [ ] `sharp` membuat varian thumb/medium/large dan metadata width/height.

**Verify:** unit test adapter; upload file 5 MB dan cek varian.
**Size:** M · **Dep:** T03

### T09 — Media manager UI
**Acceptance:**
- [ ] Grid dengan drop zone, upload progress, pencarian, filter tipe.
- [ ] Edit alt/caption via sheet; alt wajib untuk gambar.
- [ ] Media picker reusable dipakai di editor dan featured image.
- [ ] Hapus media yang dipakai memunculkan peringatan jumlah referensi.

**Size:** L · **Dep:** T08

### T10 — Editor Tiptap
**Acceptance:**
- [ ] Ekstensi sesuai PRD A-01; toolbar responsif dan bisa dilipat.
- [ ] Slash command, mode fokus, penghitung karakter.
- [ ] Gambar hanya bisa disisipkan dari media picker dan wajib punya alt.
- [ ] Konten disimpan sebagai JSON ProseMirror.

**Size:** L · **Dep:** T09

### T11 — Render dan sanitasi konten
**Acceptance:**
- [ ] `lib/content/render.ts` mengubah JSON → HTML dengan allowlist.
- [ ] Tag `script`, `iframe` non-YouTube, dan atribut event dibuang.
- [ ] Unit test dengan payload XSS (`<img onerror>`, `javascript:` link, `</script>`).

**Size:** M · **Dep:** T10

### T12 — Blog CRUD
**Acceptance:**
- [ ] List dengan search, filter status/kategori/penulis, pagination server-side.
- [ ] Create/edit dengan autosave 20 detik dan indikator "Tersimpan ... lalu".
- [ ] Revisi tersimpan; soft delete dan pemulihan dari Sampah.
- [ ] Author hanya dapat mengakses artikelnya.
- [ ] Status `in_review` → Editor menyetujui atau mengembalikan.

**Size:** L · **Dep:** T07, T10, T11

### T13 — Halaman publik
**Acceptance:**
- [ ] Beranda dengan grid asimetris, `/blog/[slug]`, `/kategori/[slug]`.
- [ ] Artikel non-published 404; pratinjau bertoken untuk penulis.
- [ ] Metadata dinamis, `sitemap.ts`, `robots.ts`.
- [ ] ISR/tag revalidation setelah publish.

**Size:** L · **Dep:** T12

### T14 — Publikasi terjadwal
**Acceptance:**
- [ ] Cron `/api/cron/publish` dengan `x-cron-secret` mempublish artikel jatuh tempo.
- [ ] Fallback lazy-publish saat halaman diakses jika cron tidak berjalan.
- [ ] Unit test untuk batas waktu dan idempotensi.

**Size:** S · **Dep:** T12

### Checkpoint M1
- [ ] Alur kategori → media → artikel → publish berjalan end-to-end
- [ ] Sanitasi XSS lolos semua test
- [ ] Lighthouse halaman artikel ≥ 90

---

## Fase M2 — SEO

### T15 — Mesin skor SEO
**Acceptance:**
- [ ] `lib/seo/score.ts` menghitung 0–100 sesuai bobot PRD A-03.
- [ ] Setiap komponen mengembalikan status, pesan, dan saran.
- [ ] Unit test dengan minimal 8 kasus (kosong, sempurna, keyword stuffing, dsb).

**Size:** M · **Dep:** T11

### T16 — Panel SEO di editor
**Acceptance:**
- [ ] Sidebar bertab: SEO, Sosial, Schema, Publikasi.
- [ ] Skor real-time (debounce 500ms) dengan bar + label teks.
- [ ] Preview SERP desktop dan mobile.
- [ ] Field canonical, robots, focus keyword tersimpan di `seo_meta`.

**Size:** L · **Dep:** T15

### T17 — OpenGraph editor dan preview
**Acceptance:**
- [ ] Kartu preview Facebook, LinkedIn, X, WhatsApp.
- [ ] Peringatan ukuran gambar < 1200×630.
- [ ] Fallback berjenjang; unit test pada output metadata.

**Size:** M · **Dep:** T16

### T18 — Schema editor
**Acceptance:**
- [ ] Template JSON-LD, validasi properti wajib, variabel `{{post.*}}`.
- [ ] Prioritas artikel → kategori → global.
- [ ] Escape `</script>`; preview + tombol salin.
- [ ] Breadcrumb otomatis dapat dimatikan.

**Size:** L · **Dep:** T16

### T19 — SEO monitor dan audit
**Acceptance:**
- [ ] Cron audit mingguan menghasilkan `seo_audits` + `seo_issues`.
- [ ] Deteksi duplikat title/description.
- [ ] Dashboard isu dengan filter tingkat dan aksi "abaikan".
- [ ] Pemeriksaan broken internal link (HEAD request, timeout 5s).

**Size:** L · **Dep:** T15, T13

### Checkpoint M2
- [ ] Skor konsisten antara editor, list, dan dashboard
- [ ] Schema valid di Rich Results Test untuk konten contoh
- [ ] sitemap.xml memuat semua artikel published

---

## Fase M3 — Analytics dan Integrasi

### T20 — Collector analytics
**Acceptance:**
- [ ] `POST /api/analytics/collect` menerima beacon, memvalidasi payload, memfilter bot.
- [ ] `visitorHash` = SHA-256(IP + UA + tanggal + salt); IP tidak disimpan.
- [ ] Rate limit 60/menit per IP-hash; respons 204 cepat (< 50ms p95).
- [ ] Unit test hash deterministik dan rotasi harian.

**Size:** M · **Dep:** T03

### T21 — Agregasi dan retensi
**Acceptance:**
- [ ] Job harian mengisi `analytics_daily`.
- [ ] Pembersihan data melewati retensi.
- [ ] Dashboard membaca agregat untuk rentang > 7 hari.
- [ ] Unit test agregasi (views, unique visitor).

**Size:** M · **Dep:** T20

### T22 — Dashboard analytics
**Acceptance:**
- [ ] KPI, area chart 7/30/90 hari, top pages, top referrer, perangkat.
- [ ] Segmented control rentang waktu; state kosong yang informatif.
- [ ] Tabel alternatif untuk chart (aksesibilitas).

**Size:** M · **Dep:** T21

### T23 — Integrasi GTM/GA4/Ads
**Acceptance:**
- [ ] Halaman `/admin/integrations` dengan validasi format ID.
- [ ] Injeksi hanya di layout publik, mode eksklusif (tanpa double counting).
- [ ] Event `page_view`, `generate_lead`, `contact_click`.
- [ ] Consent Mode v2 default `denied` + banner yang bisa dimatikan.

**Size:** M · **Dep:** T13

### Checkpoint M3
- [ ] Kunjungan nyata muncul di dashboard dalam 60 detik
- [ ] Tidak ada duplikasi hit di GA4 saat GTM aktif
- [ ] Consent menolak storage sebelum izin

---

## Fase M4 — Pelengkap

### T24 — Floating WhatsApp multi-nomor
**Acceptance:**
- [ ] CRUD nomor, normalisasi `62...`, jadwal online, bobot, mode single/list.
- [ ] Round-robin/random antar agen online; state offline.
- [ ] Aksesibilitas: aria-label, focus trap, Esc, target 56px di mobile.
- [ ] Event konversi bila integrasi aktif.

**Size:** M · **Dep:** T05

### T25 — Pengaturan situs
**Acceptance:**
- [ ] Grouped settings dengan navigasi anchor dan simpan sticky.
- [ ] Perubahan tercatat di `audit_logs`.
- [ ] Identitas situs (nama, logo, favicon, default meta) terpakai di metadata publik.

**Size:** M · **Dep:** T05

### T26 — Manajemen pengguna
**Acceptance:**
- [ ] Undang pengguna (token satu kali), ubah peran, nonaktifkan.
- [ ] Super Admin terakhir tidak bisa dihapus/diturunkan.
- [ ] Halaman undangan `/invite/[token]`.

**Size:** M · **Dep:** T04, T25

### T27 — i18n UI admin
**Acceptance:**
- [ ] Kamus `id` dan `en` di `lib/i18n/`; switch bahasa tersimpan di preferensi pengguna.
- [ ] Tidak ada string hardcoded di komponen admin.
- [ ] Tanggal dan angka mengikuti `Intl` sesuai locale.

**Size:** M · **Dep:** T05

### T28 — Audit aksesibilitas dan polish
**Acceptance:**
- [ ] axe-core bersih (tanpa serious/critical) di 6 halaman kunci.
- [ ] Semua target sentuh ≥ 44px; fokus terlihat di seluruh alur.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Uji 375/768/1024/1440 tanpa horizontal scroll.

**Size:** M · **Dep:** T13, T24

### Checkpoint M4
- [ ] E2E penuh hijau
- [ ] axe bersih
- [ ] Semua microcopy konsisten

---

## Fase M5 — Rilis

### T29 — Hardening keamanan
**Acceptance:**
- [ ] Header CSP, HSTS, X-Frame-Options, Referrer-Policy.
- [ ] `pnpm audit` tanpa high/critical; dependency dipin.
- [ ] Rate limit pada login, analytics, dan upload.
- [ ] Uji path traversal, upload SVG berbahaya, dan XSS konten.

**Size:** M · **Dep:** M1–M4

### T30 — Performa
**Acceptance:**
- [ ] LCP < 2,5s, CLS < 0,1, INP < 200ms pada halaman artikel.
- [ ] Bundle JS artikel ≤ 120 KB gzip.
- [ ] Query N+1 dihilangkan (cek dengan log Prisma).

**Size:** M · **Dep:** T13, T22

### T31 — Dokumentasi dan seed demo
**Acceptance:**
- [ ] `README.md`: prasyarat, setup, perintah, deploy Docker, env.
- [ ] `docs/` memuat PRD, plan, dan panduan kontribusi internal.
- [ ] Seed demo berisi 3 kategori, 10 artikel, 20 media placeholder.

**Size:** S · **Dep:** semua

### T32 — Deploy Docker produksi
**Acceptance:**
- [ ] Multi-stage build (deps → build → runner), image < 400 MB.
- [ ] `docker compose -f docker-compose.prod.yml up` menyajikan situs dengan healthcheck.
- [ ] Migrasi otomatis saat start (`prisma migrate deploy`).
- [ ] Prosedur backup/restore terdokumentasi dan diuji sekali.

**Size:** M · **Dep:** T31

### Checkpoint Rilis
- [ ] Semua metrik PRD Bagian 2.2 terpenuhi
- [ ] Backup/restore terbukti
- [ ] Review akhir dengan pemilik produk

---

## Risiko Implementasi

| Risiko | Fase | Mitigasi |
|---|---|---|
| Next 16.4.3 dan Node 26 memiliki perilaku berbeda | M0 | Kunci versi; image Docker Node 22 LTS |
| Prisma 7 mengubah API generator/client | M0 | Ikuti dokumentasi v7; jangan campur CLI 7 dengan client 8 |
| `sharp` di Alpine | M0 | Pakai `node:22-bookworm-slim` (glibc) |
| Editor Tiptap besar di bundle | M1 | Dynamic import `ssr:false`, pisahkan chunk |
| Cron tidak tersedia di host tertentu | M1 | Lazy-publish fallback |
| Analytics menulis terlalu sering | M3 | Batching 1 request per page view, agregasi harian |

---

## Item Keputusan Saat Implementasi

1. **SMTP:** v1 menampilkan tautan undangan untuk disalin; SMTP ditambahkan sebagai adaptor opsional.
2. **Halaman statis:** ditunda ke v1.1; v1 fokus artikel dan kategori.
3. **Multi-admin simultan:** last-write-wins dengan revisi; presence ditunda.
4. **Brand/domain:** memakai placeholder `CMSPlate` dan `NEXT_PUBLIC_SITE_URL` sampai dikonfirmasi.
5. **Auth:** sesi database buatan sendiri (bcrypt + token hash), bukan Auth.js — lihat PRD D13.
6. **Rate limit:** in-memory untuk satu instance Docker; abstraksi siap diganti Redis.
