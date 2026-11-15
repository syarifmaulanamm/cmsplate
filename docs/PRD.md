# PRD — CMSPlate

**Versi:** 1.0.0 (Final)
**Terakhir diperbarui:** 15 November 2026
**Status:** Rilis produksi. Semua fitur F-01…F-08 dan A-01…A-06 selesai.

| Item | Nilai |
|---|---|
| Nama produk | CMSPlate |
| Jenis | Boilerplate CMS (open-source) |
| Frontend & Backend | Next.js 16.4.3 (App Router) |
| UI | shadcn/ui + Tailwind CSS 4.3 |
| Database | PostgreSQL 16+ |
| ORM | Prisma |
| Storage v1 | Penyimpanan lokal (adapter S3 disiapkan untuk fase berikutnya) |
| Deployment | Docker (self-host) |
| Distribusi | Open-source (MIT) |

---

## 1. Ringkasan

CMSPlate adalah boilerplate CMS siap pakai untuk membangun website konten: blog, halaman kategori, dan halaman statis. Fokusnya adalah kecepatan mulai (dari clone hingga website tayang) dan kualitas SEO bawaan, tanpa bergantung pada layanan analytics pihak ketiga untuk statistik dasar.

Blogger atau tim konten menulis di panel admin, melihat pratinjau SEO dan kartu sosial secara langsung, lalu mempublikasikan. Developer mendapatkan basis kode yang modular, bertipe, dan mudah dikustomisasi.

---

## 2. Tujuan dan Metrik Keberhasilan

### 2.1 Tujuan Produk
1. Setup lokal hingga konten pertama tayang di bawah 30 menit.
2. Setiap artikel memiliki skor SEO, preview OpenGraph, dan schema yang tervalidasi sebelum terbit.
3. Statistik dasar tersedia tanpa layanan eksternal dan tetap patuh privasi.
4. Kode modular: menambah fitur baru tidak memerlukan perubahan besar di lapisan inti.

### 2.2 Metrik Keberhasilan v1.0
| Metrik | Target |
|---|---|
| Waktu setup lokal | ≤ 30 menit dari `git clone` |
| Lighthouse (template publik) | Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 95 |
| Alur end-to-end | Lolos tanpa error: kategori → media → artikel → SEO → publish |
| Skor SEO rata-rata konten contoh | ≥ 80 |
| Ukuran bundle JS halaman artikel | ≤ 120 KB gzip |
| Zona waktu pengambilan data analytics | ≤ 1 detik p95 pada 10 juta page view/bulan |

### 2.3 Non-Goals v1
- E-commerce, membership, paywall, dan komentar.
- Page builder drag-and-drop.
- Multi-site dalam satu instalasi.
- Integrasi Google Search Console (fase 2).
- Aplikasi mobile.

> Dua bahasa Indonesia dan Inggris **bukan** non-goal lagi. Lihat F-08.

---

## 3. Persona dan Peran

| Peran | Kebutuhan utama | Hak akses |
|---|---|---|
| **Super Admin** | Mengatur pengguna, integrasi, dan pengaturan situs | Semua aksi, termasuk hapus permanen dan manajemen pengguna |
| **Editor** | Mengelola seluruh konten dan media | CRUD semua artikel, kategori, media, publish, SEO, schema; tidak bisa mengelola pengguna |
| **Author** | Menulis artikel miliknya | CRUD artikel miliknya, upload media, submit untuk review; tidak bisa publish atau mengubah pengaturan |
| **Visitor** | Membaca konten dan menghubungi via WhatsApp | Hanya halaman publik |

**Aturan RBAC:**
- Author hanya melihat dan mengubah artikel dengan `authorId` miliknya.
- Author dapat mengirim artikel ke status `in_review`. Editor dapat menyetujui atau mengembalikan ke `draft`.
- Perubahan peran dan penghapusan pengguna hanya oleh Super Admin.
- Semua pemeriksaan otorisasi dilakukan di server (Server Action / Route Handler), bukan hanya menyembunyikan elemen UI.

---

## 4. Lingkup Fitur

Setiap fitur memiliki kriteria penerimaan yang dapat diuji. Format: **F-** untuk fitur utama, **A-** untuk tambahan.

### 4.0 Pola Halaman CRUD (berlaku untuk semua entitas)

Setiap entitas yang mendukung pengelolaan data memiliki halaman terpisah per operasi:

| Operasi | Route | Perilaku |
|---|---|---|
| Index | `/admin/<entitas>` | Tabel dengan pencarian & filter yang tersimpan di URL (`?q=&status=&page=`), pagination server-side |
| Create | `/admin/<entitas>/new` | Form kosong; penyimpanan pertama membuat draft lalu pindah ke halaman edit |
| Read | `/admin/<entitas>/[id]` | Ringkasan read-only: metadata, terjemahan, status, dan aksi Edit/Hapus |
| Update | `/admin/<entitas>/[id]/edit` | Form terisi dengan autosave (artikel) |
| Delete | Dialog konfirmasi dari index dan halaman detail | Tidak ada halaman khusus hapus |

**Aturan dialog hapus:**
- Judul menyebut nama entitas yang dihapus.
- Fokus awal pada tombol batal, bukan tombol hapus.
- Jika entitas masih dipakai (kategori punya artikel/anak), dialog menjelaskan jumlahnya dan tombol hapus dinonaktifkan.
- Aksi yang tidak dapat dibatalkan meminta konfirmasi tambahan.

### 4.1 Blog CRUD (F-01)

**Deskripsi:** Pengelolaan artikel lengkap dengan revisi dan publikasi terjadwal.

**Field artikel:**
- `title` (wajib, 3–120 karakter)
- `slug` (unik, auto-generate dari title, bisa diedit)
- `excerpt` (wajib untuk SEO, 50–200 karakter)
- `content` (JSON ProseMirror dari Tiptap)
- `featuredImageId` (relasi ke media)
- `categoryId` (wajib)
- `tags` (many-to-many)
- `status`: `draft` | `in_review` | `scheduled` | `published` | `archived`
- `publishedAt` (wajib jika `scheduled` atau `published`)
- `authorId`

**Kriteria penerimaan:**
- [ ] Slug dinormalisasi (lowercase, strip diakritik, spasi ke `-`); duplikat mendapat suffix `-2`, `-3`, dan seterusnya.
- [ ] Mengubah judul tidak otomatis mengubah slug artikel yang sudah terbit.
- [ ] Artikel `draft`, `in_review`, dan `archived` mengembalikan 404 di halaman publik (kecuali pratinjau bertoken untuk penulis yang login).
- [ ] Artikel `scheduled` otomatis berubah menjadi `published` dalam rentang 1 menit setelah `publishedAt`.
- [ ] Autosave berjalan setiap 20 detik selama ada perubahan, dengan indikator "Tersimpan ... lalu".
- [ ] Setiap penyimpanan yang mengubah konten membuat baris `post_revisions`; minimal 20 revisi terakhir dipertahankan.
- [ ] Hapus artikel bersifat soft delete (`deletedAt`); hanya Super Admin dapat menghapus permanen.
- [ ] Pencarian menjangkau title dan excerpt; filter tersedia untuk status, kategori, penulis, dan rentang tanggal.
- [ ] Daftar artikel mendukung pagination server-side (default 20 per halaman).

### 4.2 Category CRUD (F-02)

**Kriteria penerimaan:**
- [ ] Kategori hierarkis maksimal 3 level (self-referencing).
- [ ] Nama, slug, deskripsi, meta title, dan meta description disimpan per bahasa di `category_translations`.
- [ ] Halaman: index (filter + pencarian), create, detail, dan edit.
- [ ] Menghapus kategori yang masih memiliki artikel atau anak ditolak dengan dialog yang menjelaskan jumlahnya.
- [ ] Siklus parent (A → B → A) ditolak oleh validasi server.
- [ ] Slug unik per bahasa; otomatis dibuat dari nama jika dikosongkan.
- [ ] Halaman publik `/kategori/[slug]` menampilkan deskripsi dan daftar artikel terpaginasi.
- [ ] Minimal satu bahasa harus terisi; bahasa kedua opsional.

### 4.3 Media Manager (F-03)

**Kriteria penerimaan:**
- [ ] Format didukung: JPG, PNG, WebP, AVIF, GIF, SVG, dan PDF.
- [ ] Batas ukuran default 10 MB untuk gambar dan 20 MB untuk PDF, dapat diubah di pengaturan.
- [ ] SVG disanitasi sebelum disimpan; SVG dengan `<script>` atau event handler ditolak.
- [ ] Nama file di-hash (SHA-256) dan disimpan dengan struktur `YYYY/MM/<hash>.<ext>` untuk mencegah tabrakan.
- [ ] Varian dibuat otomatis: `thumb` (320w), `medium` (768w), `large` (1280w), dan `original`. Konversi ke WebP untuk varian saat browser mendukung.
- [ ] Metadata wajib: `alt` untuk gambar (divalidasi saat publish artikel), `caption` opsional.
- [ ] Grid dan list view, pencarian nama file, filter tipe, dan pengurutan berdasarkan tanggal atau ukuran.
- [ ] Media yang sedang dipakai menampilkan jumlah referensi; penghapusan memerlukan konfirmasi eksplisit dan memutus referensi (featured image menjadi kosong dengan peringatan).
- [ ] Media picker dapat dipakai di editor, featured image, dan OG image, dengan upload langsung di dalam dialog.
- [ ] Media picker berupa **dialog dua tab**: "Pilih media" (grid + pencarian) dan "Unggah" (drag-and-drop). Setelah unggah selesai, dialog pindah ke tab pilih dengan file baru terpilih.
- [ ] Halaman `/admin/media` tersedia sebagai pustaka lengkap (grid, filter, edit alt/caption, hapus, salin URL).
- [ ] Penyimpanan lokal berada di luar `public/` dan disajikan melalui Route Handler dengan `Cache-Control: public, max-age=31536000, immutable`.

### 4.4 Simple Website Analytics (F-04)

**Kriteria penerimaan:**
- [ ] Page view dicatat melalui `POST /api/analytics/collect` menggunakan `navigator.sendBeacon` dari halaman publik.
- [ ] Data yang disimpan: `path`, `referrer` (dinormalisasi ke domain), `deviceType` (desktop/mobile/tablet dari UA), `country` (dari header `cf-ipcountry`/`x-vercel-ip-country` jika ada), `visitorHash`, `createdAt`.
- [ ] `visitorHash` = SHA-256(IP + userAgent + tanggal + `ANALYTICS_SALT`), diputar setiap hari; IP mentah tidak pernah disimpan.
- [ ] Tidak menggunakan cookie pihak ketiga; cookie fungsional hanya jika consent analytics diberikan.
- [ ] Bot difilter berdasarkan daftar UA dan `navigator.webdriver`.
- [ ] Dashboard menampilkan: total view, unique visitor, top 10 halaman, top referrer, tren 7/30/90 hari, dan distribusi perangkat.
- [ ] Agregasi harian ke `analytics_daily` berjalan via cron; dashboard membaca tabel agregat, bukan tabel mentah, untuk rentang > 7 hari.
- [ ] Retensi data default 365 hari, dapat dikonfigurasi; job pembersihan berjalan harian.
- [ ] Endpoint collector memiliki rate limit 60 request/menit per IP-hash.

### 4.5 SEO Monitoring (F-05)

**Kriteria penerimaan:**
- [ ] Audit on-site menghasilkan daftar isu per halaman dengan tingkat: `critical`, `warning`, `info`.
- [ ] Aturan audit: title 30–60 karakter, meta description 70–160 karakter, konten minimal 300 kata, tepat satu H1, alt pada semua gambar konten, minimal satu link internal, canonical tidak kosong, tidak ada `noindex` yang tidak disengaja, slug ≤ 75 karakter.
- [ ] Deteksi duplikat title dan meta description antar halaman.
- [ ] `sitemap.xml` dibuat dinamis dari artikel `published` dan kategori aktif, dengan `lastModified`.
- [ ] `robots.txt` dibuat dinamis dan dapat diedit dari admin (dengan validasi sintaks dasar).
- [ ] Pemeriksaan broken internal link berjalan terjadwal (default mingguan) dan menampilkan URL sumber serta target yang gagal.
- [ ] Dashboard menampilkan skor kesehatan agregat dan daftar isu yang dapat difilter.
- [ ] Setiap isu dapat ditandai "abaikan" agar tidak muncul lagi untuk halaman tersebut.

**Catatan penting:** skor SEO adalah panduan on-site, bukan prediksi peringkat Google. Teks UI harus menyatakan hal ini agar ekspektasi jelas.

### 4.6 Integrasi GTM, GA4, dan Google Ads (F-06)

**Kriteria penerimaan:**
- [ ] Pengaturan tersedia untuk GTM Container ID (`GTM-XXXX`), GA4 Measurement ID (`G-XXXX`), dan Google Ads Conversion ID + label.
- [ ] Validasi format ID sebelum disimpan; ID tidak valid ditolak dengan pesan spesifik.
- [ ] Injeksi menggunakan `next/script` dengan strategi `afterInteractive` di root layout publik (bukan di layout admin).
- [ ] Mode eksklusif: jika GTM aktif, GA4 dan Ads tidak diinjeksi langsung untuk mencegah double counting.
- [ ] `<noscript>` iframe GTM disertakan di `<body>`.
- [ ] Event kustom: `page_view` (otomatis), `generate_lead` saat tombol WhatsApp diklik (opsional per nomor), `contact_click`.
- [ ] Consent Mode v2: default `analytics_storage` dan `ad_storage` bernilai `denied`; banner consent sederhana dapat diaktifkan/dimatikan di pengaturan.
- [ ] Semua script hanya dimuat di halaman publik, tidak di `/admin`.
- [ ] Ada mode debug yang menampilkan status koneksi tag di admin tanpa membocorkan data pengguna.

### 4.7 Rich Text Editor (A-01)

**Kriteria penerimaan:**
- [ ] Berbasis Tiptap dengan ekstensi: StarterKit, Link, Image, Table, CodeBlock, Youtube, Placeholder, CharacterCount, TextAlign.
- [ ] Toolbar mendukung: H2–H4, bold, italic, underline, strike, bullet, ordered list, blockquote, code block, tabel, link, gambar dari media manager, embed YouTube, horizontal rule.
- [ ] Gambar disisipkan dengan `alt` wajib dan atribut `srcset` dari varian media.
- [ ] Output disimpan sebagai JSON dan dirender ke HTML melalui pipeline yang disanitasi di server (`sanitize-html` dengan allowlist tag dan atribut).
- [ ] Paste dari Word/Google Docs dibersihkan dari style inline yang tidak diizinkan.
- [ ] Editor mendukung mode fokus, slash command (`/`), dan keyboard shortcut standar.
- [ ] Konten yang dirender publik tidak mengandung script, iframe di luar domain YouTube, atau atribut event.

### 4.8 Featured Image (A-02)

**Kriteria penerimaan:**
- [ ] Satu gambar utama per artikel, dipilih dari media manager atau diunggah langsung.
- [ ] Ditampilkan di kartu daftar, header artikel, dan sebagai fallback OG image.
- [ ] Rasio yang disarankan 16:9 dengan peringatan jika rasio menyimpang jauh.
- [ ] Kewajiban featured image sebelum publish dapat dimatikan di pengaturan (default: aktif).
- [ ] Next.js `Image` dengan `sizes` yang tepat dan `priority` hanya untuk gambar di atas lipatan.

### 4.9 SEO Meter & Editor (A-03)

**Kriteria penerimaan:**
- [ ] Skor 0–100 dihitung ulang saat konten berubah (debounce 500ms) dan setelah simpan.
- [ ] Komponen skor: panjang title (15), meta description (15), focus keyword di title/intro/H2 (20), panjang konten (15), link internal (10), alt gambar (10), slug (5), kelengkapan excerpt (10).
- [ ] Skor ditampilkan sebagai bar dengan label: `Kurang` (<50), `Cukup` (50–69), `Baik` (70–84), `Sangat baik` (≥85). Warna bukan satu-satunya indikator.
- [ ] Setiap item checklist menampilkan status dan saran perbaikan spesifik, bukan hanya centang.
- [ ] Field SEO: meta title (dengan hitungan karakter), meta description, canonical URL, robots `index/noindex`, `follow/nofollow`, focus keyword.
- [ ] Preview SERP untuk desktop dan mobile menggunakan data aktual artikel.
- [ ] Skor disimpan sehingga dashboard dan daftar artikel dapat menampilkannya tanpa menghitung ulang.

### 4.10 OpenGraph Preview & Editor (A-04)

**Kriteria penerimaan:**
- [ ] Field: `ogTitle`, `ogDescription`, `ogImageId`, `ogType`, `twitterCard`.
- [ ] Fallback berurutan: field OG → title/excerpt → featured image → default situs.
- [ ] Preview kartu untuk Facebook, LinkedIn, X/Twitter, dan WhatsApp, dengan batas karakter yang berbeda per platform.
- [ ] Peringatan jika gambar < 1200×630 atau > 5 MB.
- [ ] Halaman publik menghasilkan tag `og:*`, `twitter:*`, dan `canonical` yang benar; diverifikasi dengan unit test pada output metadata.
- [ ] Gambar OG dinamis opsional (`/api/og?slug=...`) menggunakan `next/og` jika tidak ada gambar khusus.

### 4.11 Schema Editor (A-05)

**Kriteria penerimaan:**
- [ ] Template bawaan: `Article`, `BlogPosting`, `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`, `LocalBusiness`.
- [ ] Editor JSON dengan validasi sintaks dan validasi properti wajib per tipe; tombol simpan nonaktif jika invalid.
- [ ] Variabel dinamis: `{{post.title}}`, `{{post.excerpt}}`, `{{post.featuredImage}}`, `{{post.author.name}}`, `{{post.publishedAt}}`, `{{post.url}}`, `{{site.name}}`, `{{site.url}}`.
- [ ] Resolusi variabel terjadi di server; nilai yang tidak tersedia menjadi string kosong dan memicu peringatan validasi, bukan error runtime.
- [ ] Schema dapat diatur di tiga tingkat dengan prioritas: artikel → kategori → global.
- [ ] Preview menampilkan `<script type="application/ld+json">` yang dihasilkan, dengan tombol salin dan tautan ke Rich Results Test.
- [ ] Schema `BreadcrumbList` dibuat otomatis dari hierarki kategori dan title artikel (dapat dimatikan).
- [ ] JSON-LD di-escape terhadap `</script>` untuk mencegah XSS.

### 4.12 Floating WhatsApp Button dengan Multiple Nomor (A-06)

**Kriteria penerimaan:**
- [ ] Mendukung banyak nomor dengan field: label, nomor (format internasional), nama agen, avatar opsional, pesan default, jadwal online, bobot tampil, aktif/nonaktif.
- [ ] Nomor dinormalisasi ke format `62...` (tanpa `+`, tanpa `0` di depan) dan divalidasi.
- [ ] Mode tampilan: `single` (langsung ke satu nomor) atau `list` (popup daftar agen).
- [ ] Mode `list` mendukung pemilihan `round-robin` atau `random` jika lebih dari satu nomor online.
- [ ] Nomor di luar jadwal online disembunyikan; jika semua offline, tombol menampilkan state "sedang offline" dengan pesan alternatif atau disembunyikan sepenuhnya (dapat dikonfigurasi).
- [ ] Konfigurasi posisi: kanan bawah atau kiri bawah, dengan offset yang dapat diatur.
- [ ] Tombol dapat dinonaktifkan pada halaman tertentu melalui pengaturan atau frontmatter halaman.
- [ ] Klik menghasilkan event `generate_lead` jika integrasi aktif.
- [ ] Aksesibilitas: tombol memiliki `aria-label` yang jelas, dapat dioperasikan dengan keyboard, popup menutup dengan `Esc`, dan focus trap saat terbuka.
- [ ] Mobile: target sentuh minimal 56px dan tidak menutupi elemen navigasi kritis.

### 4.13 Pengaturan Situs dan Pengguna (F-07)

**Kriteria penerimaan:**
- [ ] Pengaturan: nama situs, tagline, URL kanonik, logo, favicon, default meta, bahasa UI (`id`/`en`), zona waktu, batas upload, retensi analytics, banner consent, dan kebijakan komentar (tidak aktif di v1).
- [ ] Manajemen pengguna: undang pengguna via email (token satu kali), ubah peran, nonaktifkan akun.
- [ ] Pengguna tidak dapat menghapus atau menurunkan peran dirinya sendiri jika ia satu-satunya Super Admin.
- [ ] Perubahan pengaturan dicatat di `audit_logs` (aktor, aksi, sebelum, sesudah, waktu).

### 4.14 Dukungan Dua Bahasa (F-08)

**Kriteria penerimaan:**
- [ ] Semua halaman publik tersedia di `/id` dan `/en`; root `/` mengarah ke locale dari cookie, lalu `Accept-Language`, lalu default `id`.
- [ ] `<html lang>` mengikuti locale (`id-ID`, `en-US`).
- [ ] UI publik dan admin diterjemahkan lewat kamus bertipe (`id`, `en`); kunci yang tidak sinkron gagal saat typecheck dan test.
- [ ] Konten yang dapat diterjemahkan: kategori dan artikel. Minimal satu bahasa wajib terisi.
- [ ] Halaman bahasa Inggris hanya dibuat jika terjemahannya ada; tidak ada halaman kosong.
- [ ] `hreflang` (`id-ID`, `en-US`, `x-default`) dan canonical per locale.
- [ ] Pemilih bahasa di header publik menyimpan pilihan ke cookie.
- [ ] Bahasa admin disimpan per pengguna dan bisa diganti dari menu pengguna.
- [ ] Tanggal dan angka mengikuti locale (`Intl`).

---

## 5. Design System

Arah visual: **tenang, hangat, lapang, dengan sentuhan kecil yang membuat tidak kaku**. Panel admin dan halaman publik berbagi satu identitas brand, tetapi berbeda kepadatan.

### 5.1 Prinsip
1. **Ruang lebih penting daripada ornamen.** Jarak yang konsisten lebih terasa rapi daripada border dan shadow bertumpuk.
2. **Kedalaman dari border dan warna, bukan shadow berat.** Shadow hanya untuk elemen mengambang (popover, dropdown, dialog).
3. **Satu aksen.** Terakota `#C2410C` sebagai primary. Warna lain hanya untuk status.
4. **Tenang saat menulis.** Editor memberi ruang, tipografi nyaman, dan chrome minimal.
5. **Sistem, bukan hiasan.** Semua nilai berasal dari token; tidak ada hex ad-hoc di komponen.

### 5.2 Tipografi

| Konteks | Font | Ukuran | Catatan |
|---|---|---|---|
| UI admin | Geist Sans | 14px body, 13px label, 20–28px heading | Dimuat via `next/font/local` atau `next/font/google` |
| Teknis admin | Geist Mono | 13px | Slug, JSON schema, ID, kode |
| Judul publik | Newsreader (serif) | 32–56px, line-height 1.15 | Variabel italic untuk penekanan |
| Body publik | Geist Sans | 17–18px, line-height 1.7 | Lebar baca maksimal 68 karakter |

Skala tipe: `12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 38 / 48 / 60`. Hindari ukuran di luar skala.

### 5.3 Token Warna

Nilai ditulis dalam hex untuk keterbacaan; implementasi memakai `oklch()` agar gradasi antar tema konsisten.

**Light mode:**

| Token | Hex | OKLCH (perkiraan) | Pemakaian |
|---|---|---|---|
| `--background` | `#FBFAF7` | `oklch(0.985 0.002 90)` | Latar halaman (nuansa kertas) |
| `--card` | `#FFFFFF` | `oklch(1 0 0)` | Card, sheet, dialog |
| `--foreground` | `#1C1917` | `oklch(0.22 0.006 60)` | Teks utama |
| `--muted-foreground` | `#57534E` | `oklch(0.44 0.006 60)` | Teks sekunder, placeholder |
| `--border` | `#E7E5E4` | `oklch(0.91 0.004 60)` | Border default |
| `--primary` | `#C2410C` | `oklch(0.55 0.17 40)` | Tombol utama, link aktif |
| `--primary-foreground` | `#FFF7ED` | `oklch(0.975 0.015 60)` | Teks di atas primary |
| `--secondary` | `#F5F0EA` | `oklch(0.955 0.01 70)` | Tombol sekunder, chip |
| `--accent` | `#F3E8DF` | `oklch(0.93 0.02 60)` | Hover, item terpilih |
| `--success` | `#15803D` | `oklch(0.53 0.14 145)` | Status published, skor baik |
| `--warning` | `#B45309` | `oklch(0.55 0.13 60)` | Skor sedang, peringatan |
| `--destructive` | `#B91C1C` | `oklch(0.52 0.19 25)` | Hapus, error |
| `--whatsapp` | `#25D366` | `oklch(0.76 0.17 150)` | Tombol WhatsApp |

**Dark mode:**

| Token | Hex |
|---|---|
| `--background` | `#17140F` |
| `--card` | `#201C16` |
| `--foreground` | `#F5F5F4` |
| `--muted-foreground` | `#A8A29E` |
| `--border` | `#2E2924` |
| `--primary` | `#F97316` |
| `--primary-foreground` | `#1C1917` |

**Kontras terverifikasi:** `#57534E` di atas `#FBFAF7` = 7,5:1; `#C2410C` di atas `#FFFFFF` = 5,2:1; `#F5F5F4` di atas `#17140F` = 15,8:1. Semua memenuhi WCAG AA, sebagian AAA.

**Warna chart** (5 seri, ramah buta warna): `#C2410C`, `#0F766E`, `#7C3AED`, `#B45309`, `#475569`.

### 5.4 Bentuk, Spasi, dan Elevasi

| Properti | Nilai |
|---|---|
| Radius | `--radius: 0.75rem` (12px). Tombol & input 12px, card 16px, badge `full`, dialog 20px |
| Spasi | Skala 4px: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` |
| Padding card | 24px (`p-6`) |
| Jarak antar section | 32–48px |
| Border | 1px `--border`; border lebih tebal (2px) hanya untuk item terpilih |
| Shadow `sm` | `0 1px 2px rgb(28 25 23 / 0.05)` — card |
| Shadow `md` | `0 6px 16px -4px rgb(28 25 23 / 0.10)` — dropdown, popover |
| Shadow `lg` | `0 16px 40px -8px rgb(28 25 23 / 0.14)` — dialog, WhatsApp popup |
| Z-index | `10` sticky, `20` dropdown, `30` dialog, `40` toast, `50` WhatsApp |

### 5.5 Layout

- **Admin:** sidebar tetap 264px (collapsible ke 72px), topbar 56px dengan breadcrumb, pencarian ⌘K, dan menu pengguna. Kontainer konten `max-w-[1440px]` dengan padding 24–32px.
- **Editor:** kolom tulisan `max-w-[680px]` di tengah, sidebar kanan 380px (SEO/OG/Schema) yang bisa dilipat. Di layar < 1280px sidebar berubah menjadi tab.
- **Publik:** kontainer `max-w-[1120px]`. Beranda memakai grid asimetris 12 kolom (artikel utama 7 kolom, dua artikel pendamping 5 kolom).
- **Breakpoint uji:** 375, 768, 1024, 1280, 1440.
- **Navbar publik:** floating `top-4 left-4 right-4` dengan `backdrop-blur` dan border transparan; tambahkan `scroll-margin-top` pada heading agar anchor tidak tertutup.

### 5.6 Komponen shadcn yang Dipakai

`button`, `input`, `textarea`, `label`, `form`, `select`, `checkbox`, `radio-group`, `switch`, `badge`, `card`, `table`, `data-table` (blok), `tabs`, `dialog`, `sheet`, `drawer`, `popover`, `dropdown-menu`, `command`, `sidebar`, `breadcrumb`, `avatar`, `tooltip`, `toast`/`sonner`, `progress`, `skeleton`, `separator`, `scroll-area`, `alert`, `alert-dialog`, `collapsible`, `resizable`, `chart` (recharts wrapper).

Kustomisasi yang dijaga konsisten:
- `button`: varian `default` (primary), `soft` (secondary), `ghost`, `destructive`, `outline`. Radius 12px, tinggi 40px (36px untuk `sm`), `cursor-pointer`, transisi 150ms.
- `input`: tinggi 40px, border `--border`, ring fokus `--primary` dengan offset 2px.
- `badge`: radius full, padding `4px 10px`, teks 12px semibold. Varian status: draft (stone), in_review (amber), scheduled (violet), published (green), archived (stone muted).
- `table`: header sticky dengan background `--background`, baris hover `--accent`, tinggi baris 56px.

### 5.7 Pola Layar Admin

| Layar | Pola |
|---|---|
| Dashboard | Sapaan kontekstual ("Selamat pagi, Sari"), 4 KPI card dengan sparkline, daftar artikel terakhir, kartu "SEO perlu perhatian" |
| Daftar artikel | Toolbar: search, filter chip, tombol "Tulis artikel". Bulk action muncul saat baris dipilih. Empty state dengan satu aksi |
| Editor | Judul besar tanpa border di atas, slug inline yang bisa diedit, body Tiptap, sidebar kanan bertab (SEO / Sosial / Schema / Publikasi) |
| Media | Grid masonry sederhana dengan drop zone, hover menampilkan tombol ringkas, detail via sheet |
| Analytics | Kartu ringkasan + area chart satu warna, tabel top pages; rentang waktu sebagai segmented control |
| SEO Monitor | Skor besar dengan label teks, tabel isu dengan filter tingkat, aksi "abaikan" per isu |
| Pengaturan | Grouped settings dengan anchor navigation di kiri dan form di kanan; tombol simpan sticky di bawah |

### 5.8 Pola Halaman Publik

- **Beranda:** hero teks (judul serif 48–56px, subjudul 18px), grid artikel asimetris, chip kategori, footer ringkas dengan tautan WhatsApp.
- **Artikel:** breadcrumb → judul serif → meta (avatar inisial, nama, tanggal, waktu baca) → featured image → konten 68ch → tag → artikel terkait.
- **Kategori:** header dengan judul dan deskripsi, lalu daftar artikel dalam grid 2–3 kolom.
- **404:** ilustrasi garis sederhana dari ikon Lucide, pesan hangat, tombol kembali ke beranda dan tautan ke artikel terbaru.
- **Loading:** skeleton dengan bentuk menyerupai konten akhir (tidak ada spinner penuh layar).

### 5.9 Motion

| Interaksi | Durasi | Easing |
|---|---|---|
| Hover tombol/link | 150ms | `ease-out` |
| Buka/tutup popover, toast | 180ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Dialog, sheet | 220ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Indikator sidebar | 200ms | `ease-out` |
| Pulse WhatsApp (hanya 3 kali saat muncul) | 2s | `ease-in-out` |

Aturan: hanya `transform` dan `opacity` yang dianimasikan; tidak ada animasi `width`, `height`, atau `top`. Semua transisi dinonaktifkan dengan `prefers-reduced-motion: reduce`.

### 5.10 Microcopy

Suara: ramah, langsung, tidak birokratis, tanpa berlebihan.

| Konteks | Contoh |
|---|---|
| Empty state artikel | "Belum ada artikel. Yuk, tulis yang pertama." + tombol "Tulis artikel" |
| Sukses publish | "Artikel sudah tayang." + link "Lihat halaman" |
| Autosave | "Tersimpan 3 detik lalu" |
| Hapus | "Pindahkan ke Sampah? Kamu masih bisa memulihkannya dalam 30 hari." |
| Validasi slug | "Slug ini sudah dipakai artikel lain. Coba 'panduan-seo-2'." |
| WhatsApp offline | "Tim kami sedang offline. Tinggalkan pesan, kami balas besok pagi." |
| Error server | "Ada yang tidak beres saat menyimpan. Perubahanmu aman di draft — coba lagi." |

Panduan: hindari kata "Error", "Invalid", "Gagal" tanpa penjelasan; selalu sertakan langkah berikutnya. Gunakan "kamu" (bukan "Anda") di admin, dan "Anda" di halaman publik.

### 5.11 Aksesibilitas

- Semua target sentuh minimal 44×44px; tombol WhatsApp minimal 56px di mobile.
- `focus-visible` ring 2px `--primary` dengan `offset-2` pada semua elemen interaktif.
- Ikon saja wajib memiliki `aria-label`; ikon dekoratif `aria-hidden`.
- Form: `label` eksplisit, `aria-describedby` untuk teks bantuan dan error, `aria-invalid` saat error.
- Status tidak boleh hanya dibedakan warna; selalu ada ikon dan/atau teks.
- Tabel data memiliki `<caption>` atau `aria-label` dan struktur `thead`/`tbody` yang benar.
- Kontras minimum 4,5:1 untuk teks normal dan 3:1 untuk teks besar.
- Dialog dan sheet memerangkap fokus, menutup dengan `Esc`, dan mengembalikan fokus ke pemicu.
- Halaman publik mendukung navigasi keyboard penuh dan skip link.

### 5.12 Larangan Visual

- Tidak ada emoji sebagai ikon UI. Gunakan Lucide untuk UI dan Simple Icons untuk logo brand.
- Tidak ada glassmorphism berat atau neumorphism; kontras lebih penting daripada tren.
- Tidak ada gradient dekoratif pada tombol atau card.
- Tidak ada animasi yang menggeser layout (scale pada card yang berisi teks).
- Tidak ada campuran ikon dari beberapa set.
- Tidak ada hex langsung di komponen; semua lewat token.

---

## 6. Arsitektur Teknis

### 6.1 Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16.4.3, App Router, TypeScript strict | Server Components mengurangi JS klien; Server Actions menyederhanakan mutasi |
| Styling | Tailwind CSS 4.3 (`@theme`, CSS-first) | Konfigurasi token di CSS, lebih sedikit konfigurasi JS |
| Komponen | shadcn/ui (base `stone`, style `new-york`) | Dimiliki di repo, mudah dikustomisasi |
| Editor | Tiptap 3 | Ekstensibel, output JSON terstruktur |
| Database | PostgreSQL 16 | JSONB untuk konten dan schema, full-text search bawaan |
| ORM | Prisma 6 | Migrasi, tipe aman, seed mudah |
| Auth | Auth sendiri: Credentials + sesi database + bcrypt | Auth.js v5 tidak mendukung sesi database untuk Credentials; implementasi sendiri lebih kecil dan sesuai kebutuhan internal |
| Validasi | Zod | Satu skema untuk form dan server |
| Form | React Hook Form + `@hookform/resolvers` | Terintegrasi dengan shadcn Form |
| Sanitasi | `sanitize-html` + `isomorphic-dompurify` | Perlindungan XSS berlapis |
| Image | `sharp` | Varian dan konversi WebP/AVIF |
| Chart | Recharts via shadcn `chart` | Ringan dan cukup untuk kebutuhan |
| Test | Vitest + Testing Library, Playwright | Unit cepat, E2E untuk alur kritis |
| Container | Docker multi-stage + Compose (app + db) | Deploy self-host yang konsisten |

### 6.2 Struktur Proyek

```
app/
  (public)/
    layout.tsx              # navbar, footer, script GTM/GA
    page.tsx                # beranda
    blog/[slug]/page.tsx    # detail artikel
    kategori/[slug]/page.tsx
    halaman/[slug]/page.tsx # halaman statis
  (admin)/
    admin/
      layout.tsx            # sidebar, topbar, guard RBAC
      page.tsx              # dashboard
      posts/                # list, new, [id]/edit
      categories/
      media/
      analytics/
      seo/
      integrations/
      whatsapp/
      schema/
      users/
      settings/
  api/
    analytics/collect/route.ts
    media/[...path]/route.ts
    og/route.ts
    cron/publish/route.ts
    cron/audit/route.ts
  sitemap.ts
  robots.ts
  globals.css               # @theme tokens
components/
  ui/                       # shadcn (generated, aman diedit)
  admin/                    # sidebar, data-table, editor, seo-panel, dsb.
  public/                   # post-card, navbar, footer, whatsapp-button
lib/
  db.ts                     # Prisma singleton
  auth.ts
  rbac.ts
  seo/                      # score, audit, metadata, schema
  analytics/                # hash, aggregate, collector
  media/                    # storage adapter, variants
  content/                  # sanitize, render, slugify, read-time
  settings.ts
  env.ts                    # validasi env dengan Zod
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/
e2e/
docs/
  PRD.md
```

### 6.3 Alur Data

- **Baca:** halaman publik adalah Server Component; query Prisma langsung di server; cache dengan `revalidateTag('posts')` dan `revalidateTag(\`post:${slug}\`)`.
- **Tulis:** Server Action memvalidasi dengan Zod → cek RBAC → tulis ke DB dalam transaksi → `revalidateTag`.
- **Analytics:** client `sendBeacon` → Route Handler → validasi → hash → insert; job agregasi harian.
- **Media:** upload ke Route Handler → `sharp` membuat varian → tulis metadata → simpan file di volume lokal (`/data/uploads`) → serve via Route Handler dengan cache immutable.
- **Cron:** dipicu oleh `cron` di container sidecar atau endpoint `/api/cron/*` dengan header `x-cron-secret`.

### 6.4 Environment

```
DATABASE_URL=postgresql://user:pass@db:5432/simplecms
AUTH_SECRET=
ANALYTICS_SALT=
CRON_SECRET=
UPLOAD_DIR=/data/uploads
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STORAGE_DRIVER=local        # local | s3 (fase 2)
```

Semua variabel divalidasi saat boot di `lib/env.ts`; aplikasi gagal dengan pesan jelas jika ada yang hilang.

### 6.5 Perintah

```
Dev:        pnpm dev
Build:      pnpm build
Start:      pnpm start
Lint:       pnpm lint
Typecheck:  pnpm typecheck
Test:       pnpm test
Test watch: pnpm test -- --watch
E2E:        pnpm test:e2e
DB migrate: pnpm prisma migrate dev
DB deploy:  pnpm prisma migrate deploy
DB seed:    pnpm prisma db seed
DB studio:  pnpm prisma studio
Docker:     docker compose up --build
```

### 6.6 Gaya Kode

- TypeScript strict; tidak ada `any` tanpa komentar alasan.
- Komponen React: fungsi bernama, `export default` hanya untuk page/layout.
- Server Component sebagai default; `"use client"` hanya jika butuh state/efek, dan diletakkan sedalam mungkin.
- Query DB hanya di `lib/**` atau Server Action, tidak di komponen presentasional.
- Setiap mutasi mengembalikan `{ ok: true, data }` atau `{ ok: false, error: { code, message, fieldErrors? } }`.

Contoh Server Action:

```ts
"use server";

export async function updatePost(input: unknown) {
  const session = await requireRole("editor");
  const parsed = postUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: { code: "VALIDATION", fieldErrors: parsed.error.flatten().fieldErrors } };
  }
  const post = await db.post.update({
    where: { id: parsed.data.id },
    data: { ...parsed.data, updatedById: session.user.id },
  });
  revalidateTag(`post:${post.slug}`);
  return { ok: true as const, data: post };
}
```

### 6.7 Strategi Testing

- **Unit (Vitest):** `lib/seo/score`, `lib/seo/audit`, `lib/content/sanitize`, `lib/analytics/hash`, `lib/content/slugify`, validasi Zod.
- **Integrasi (Vitest + test DB):** Server Actions untuk post, category, media; cek RBAC.
- **E2E (Playwright):** login → buat kategori → upload media → tulis artikel → isi SEO → publish → verifikasi halaman publik, sitemap, dan OG tag.
- **Aksesibilitas:** `axe-core` pada halaman publik utama dan dua layar admin di CI.
- **Target cakupan:** 80% pada `lib/`, 60% keseluruhan.

### 6.8 Batasan Kerja

- **Selalu:** jalankan `lint`, `typecheck`, dan `test` sebelum commit; validasi input di server; sanitasi HTML sebelum render; gunakan token warna.
- **Tanya dulu:** perubahan skema database, menambah dependency produksi, mengubah konfigurasi CI, mengubah aturan RBAC.
- **Jangan:** commit secret, mengubah file migrasi yang sudah diterapkan, menghapus test tanpa persetujuan, memakai `any` sebagai jalan pintas, menaruh hex warna di komponen.

---

## 7. Model Data

```
users(id, email, name, passwordHash, role, isActive, createdAt, updatedAt)
sessions(id, userId, expiresAt)
posts(id, authorId, updatedById, categoryId, featuredImageId, deletedAt, timestamps)
post_translations(id, postId, locale, title, slug, excerpt, content Json, contentHtml,
                  contentText, status, publishedAt, readTime, seoScore, focusKeyword,
                  metaTitle, metaDescription)  -- unik (postId, locale) & (locale, slug)
post_revisions(id, postId, content Json, title, createdById, createdAt)
categories(id, parentId, position, timestamps)
category_translations(id, categoryId, locale, name, slug, description,
                      metaTitle, metaDescription)  -- unik (categoryId, locale) & (locale, slug)
tags(id, name, slug)
post_tags(postId, tagId)
media(id, filename, mimeType, size, width, height, hash, alt, caption,
      uploadedById, createdAt)
media_variants(id, mediaId, label, path, width, height, format)
seo_meta(id, entityType, entityId, metaTitle, metaDescription, canonicalUrl,
         robotsIndex, robotsFollow, focusKeyword, ogTitle, ogDescription,
         ogImageId, ogType, twitterCard, seoScore)
schema_templates(id, name, type, template Json, isDefault)
post_schemas(id, postId, templateId, data Json, isActive)
organization_schemas(id, scope, scopeId, data Json)
analytics_pageviews(id, path, referrer, deviceType, country, visitorHash, createdAt)
analytics_daily(date, path, views, visitors)
seo_audits(id, url, entityType, entityId, score, ranAt)
seo_issues(id, auditId, severity, rule, message, entityId, ignoredAt)
integrations(id, key, value, isEnabled)          -- gtm, ga4, ads
whatsapp_numbers(id, label, phone, agentName, avatarMediaId, defaultMessage,
                 isActive, schedule Json, weight)
settings(key, value Json)
audit_logs(id, actorId, action, entityType, entityId, before Json, after Json, createdAt)
```

**Indeks penting:** `posts(slug)` unique, `posts(status, publishedAt)`, `posts(categoryId)`, `analytics_pageviews(createdAt)`, `analytics_pageviews(visitorHash, createdAt)`, `analytics_daily(date, path)` unique, `media(hash)` unique, `seo_issues(auditId, severity)`.

**Kebijakan:** `onDelete` untuk `posts.categoryId` adalah `Restrict` (mencegah kategori terhapus saat masih dipakai); `media` yang direferensikan menggunakan `SetNull` dengan peringatan di UI.

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Performa | LCP < 2,5s pada 4G; INP < 200ms; CLS < 0,1 |
| Skalabilitas | 100.000 artikel; 10 juta page view/bulan dengan agregasi harian |
| Keamanan | Sesi database + CSRF, rate limit login (5/menit/IP), sanitasi HTML berlapis, validasi server, header keamanan (CSP, HSTS, X-Content-Type-Options) |
| Privasi | Tanpa cookie pihak ketiga; IP di-hash; consent mode default denied; dokumentasi privasi disertakan |
| Aksesibilitas | WCAG 2.1 AA untuk publik dan admin |
| Observabilitas | Log terstruktur (pino), error tracking opsional, `/api/health` untuk readiness |
| Backup | `pg_dump` harian + volume upload; prosedur restore terdokumentasi |
| i18n UI | Bahasa Indonesia (default) dan Inggris; konten tidak diterjemahkan |
| Kompatibilitas | Dua versi terakhir Chrome, Firefox, Safari, Edge; iOS 16+; Android 10+ |

---

## 9. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| API Next.js 16.x berubah | Build rusak | Versi dikunci di lockfile; changelog migrasi di `docs/` |
| Tailwind 4 masih berevolusi | Token/plugin tidak kompatibel | Gunakan fitur stabil (`@theme`, `@utility`); hindari plugin lama |
| Query analytics membebani DB | Dashboard lambat | Tabel agregat harian, retensi, indeks komposit, rate limit collector |
| XSS dari rich text atau SVG | Keamanan | Sanitasi server, allowlist, tolak SVG berisiko, CSP |
| Penyimpanan lokal tidak scalable | Migrasi sulit | Abstraksi `StorageAdapter` sejak v1 agar S3 tinggal ditambah |
| Skor SEO disalahartikan | Ekspektasi pengguna | Label "panduan", disclaimer di UI dan dokumentasi |
| Cron tidak berjalan di sebagian host | Artikel terjadwal tidak terbit | Fallback lazy-publish saat halaman publik diakses + health check cron |
| Upload besar menghabiskan disk | Downtime | Batas ukuran, monitoring disk, dokumentasi pembersihan |

---

## 10. Milestone

| Fase | Cakupan | Estimasi | Verifikasi |
|---|---|---|---|
| **M0 — Fondasi** | Repo, Tailwind 4 tokens, shadcn, Prisma + Docker, auth, RBAC, layout admin, `lib/env` | 1 minggu | Login dan navigasi admin berjalan; `docker compose up` bersih |
| **M1 — Konten** | Blog CRUD, category, revisi, Tiptap, featured image, media manager + storage adapter | 2 minggu | Artikel tayang lewat alur penuh; media varian dibuat |
| **M2 — SEO** | SEO meter, editor meta, OG preview, schema editor, sitemap/robots, SEO monitor + cron audit | 2 minggu | Skor konsisten; audit menghasilkan isu; schema valid |
| **M3 — Analytics & Integrasi** | Collector, dashboard, agregasi, retensi, GTM/GA4/Ads, consent | 1,5 minggu | Data masuk; tidak ada double counting; consent berfungsi |
| **M4 — Pelengkap** | WhatsApp multi-nomor, pengaturan situs, users, i18n UI, aksesibilitas, E2E | 1 minggu | E2E hijau; axe tanpa pelanggaran serius |
| **M5 — Rilis** | Hardening, performa, dokumentasi, seed demo, panduan deploy | 0,5 minggu | Semua metrik Bagian 2.2 terpenuhi |

Total estimasi: ±8 minggu untuk satu developer.

---

## 11. Keputusan (Decision Log)

| # | Keputusan | Alternatif | Alasan |
|---|---|---|---|
| D1 | Deployment Docker self-host | Vercel | Kontrol penuh atas DB, storage lokal, dan cron; sesuai kebutuhan internal |
| D2 | Prisma sebagai ORM | Drizzle | Migrasi dan seed lebih matang; tim familiar; performa memadai untuk skala target |
| D3 | Storage lokal v1 dengan `StorageAdapter` | S3 sejak awal | Mengurangi ketergantungan eksternal di v1; abstraksi menjaga jalur migrasi |
| D4 | Frontend publik disertakan penuh | Admin + API saja | Boilerplate harus bisa langsung dipakai; template publik menjadi referensi implementasi |
| D5 | Tiga peran (Super Admin, Editor, Author) | Dua peran atau granular permission | Cukup untuk tim konten kecil tanpa kompleksitas permission matrix |
| D6 | Lisensi MIT (open-source) | Lisensi internal | Distribusi publik dengan lisensi permisif; memudahkan adopsi dan kontribusi |
| D7 | Satu aksen brand (terakota) untuk admin dan publik | Indigo di admin, terakota di publik | Identitas terasa utuh; dapat diganti lewat satu token `--primary` |
| D8 | Arah visual hangat-minimal, bukan data-dense | Data-dense dashboard (rekomendasi tool) | CMS dipakai harian; kepadatan tinggi melelahkan dan bertentangan dengan tujuan "tidak kaku" |
| D9 | Tiptap sebagai editor | Lexical, Plate | Ekosistem ekstensi luas, output JSON stabil, dokumentasi baik |
| D10 | Analytics first-party tanpa cookie | GA4 saja | Privasi dan kemandirian data; GA4 tetap tersedia sebagai integrasi opsional |
| D11 | Tailwind 4 konfigurasi CSS-first | `tailwind.config.ts` | Sesuai arah Tailwind 4; lebih sedikit duplikasi konfigurasi |
| D12 | Agregasi harian untuk analytics | Query langsung tabel mentah | Menjaga performa dashboard pada data besar |
| D13 | Auth sendiri dengan sesi database | Auth.js v5 + Credentials | Auth.js v5 memaksa JWT untuk Credentials; sesi database memberi kontrol logout dan audit yang lebih jelas |
| D14 | Rate limit login in-memory | Redis / tabel Postgres | Deployment v1 satu instance; antarmuka `rateLimit(key, limit, window)` memudahkan penggantian nanti |
| D15 | Dua bahasa penuh (UI + konten) | UI saja | Permintaan produk; konten dua bahasa tanpa duplikasi struktur |
| D16 | Prefiks locale untuk keduanya (`/id`, `/en`) | ID tanpa prefiks | Simetris, sederhana untuk hreflang dan canonical |
| D17 | Kamus sendiri, bukan library i18n | `next-intl` | Hanya dua bahasa, tanpa plural kompleks; lebih kecil dan tanpa dependensi |
| D18 | Tabel terjemahan terpisah (`category_translations`, `post_translations`) | Kolom `locale` pada entitas | Slug unik per bahasa, status per bahasa, dan SEO per terjemahan |
| D19 | Hapus melalui dialog konfirmasi, bukan halaman | Halaman `/delete` | Lebih cepat, fokus tetap di daftar; entitas yang masih dipakai diblokir dengan penjelasan |

---

## 12. Pertanyaan Terbuka

1. Apakah email undangan pengguna memerlukan SMTP nyata di v1, atau cukup menampilkan tautan undangan di UI untuk disalin manual?
2. Perlukah halaman statis (About, Contact) dikelola di CMS v1, atau cukup artikel dan kategori?
3. Domain produksi dan nama brand sudah ada? Ini memengaruhi seed data dan default meta.
4. Apakah perlu dukungan multi-admin simultan di editor yang sama (presence), atau cukup autosave dengan last-write-wins?

---

## 13. Checklist Persetujuan

- [ ] Tujuan dan metrik disetujui
- [ ] Lingkup fitur dan kriteria penerimaan disetujui
- [ ] Design system disetujui (warna, tipografi, pola layar)
- [ ] Arsitektur dan model data disetujui
- [ ] Keputusan D1–D12 disetujui
- [ ] Pertanyaan terbuka dijawab
- [ ] Siap masuk fase perencanaan tugas (task breakdown)
