# Release Checklist — v1.0.0

Gunakan dokumen ini untuk setiap rilis. Ganti nomor versi sesuai kebutuhan.

## 1. Persiapan (sebelum rilis)

- [ ] `package.json` versi sudah dinaikkan (semver).
- [ ] `CHANGELOG.md` memuat perubahan pada bagian versi tersebut.
- [ ] `docs/PRD.md` dan `docs/PLAN.md` mencerminkan status terbaru.
- [ ] Tidak ada TODO kritis di kode (`rg "TODO|FIXME" app lib components`).
- [ ] Tidak ada file debug, dump, atau data uji di repo.
- [ ] `data/` dan `.env*` tidak ikut ter-commit.

## 2. Gerbang otomatis

Jalankan semuanya dan pastikan hijau:

```bash
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm prisma db seed          # hanya untuk lingkungan uji
pnpm lint
pnpm typecheck
pnpm test
pnpm build
E2E_BASE_URL=http://localhost:3100 pnpm test:e2e
```

Untuk E2E lokal:

```bash
PORT=3100 pnpm start &
E2E_BASE_URL=http://localhost:3100 pnpm test:e2e
```

Checklist gerbang:

- [ ] Lint bersih.
- [ ] Typecheck bersih.
- [ ] Unit test lulus.
- [ ] Build produksi sukses.
- [ ] E2E lulus (butuh database berjalan dan seed).
- [ ] `pnpm audit --audit-level=high` tidak menemukan high/critical.

## 3. Verifikasi image Docker

```bash
docker build --target runner -t cmsplate:1.0.0 .
docker images cmsplate:1.0.0
```

- [ ] Image terbentuk (±350 MB).
- [ ] Container start dan `/api/health` 200.
- [ ] `/login` dan `/id` 200.
- [ ] `prisma migrate deploy` berjalan tanpa error di log start.

## 4. Uji manual singkat (smoke)

Lakukan pada build produksi:

- [ ] Login Super Admin, ganti bahasa admin, logout.
- [ ] Buat kategori dua bahasa, edit, lalu hapus (dialog konfirmasi).
- [ ] Upload media, isi alt, sisipkan ke artikel.
- [ ] Buat artikel ID + EN, isi SEO meter, publikasikan, buka `/id/blog/...` dan `/en/blog/...`.
- [ ] Artikel draft/terjadwal mengembalikan 404.
- [ ] OG title tampil di `<meta>`; schema JSON-LD valid.
- [ ] Hapus artikel → muncul di Sampah → pulihkan.
- [ ] Jalankan audit SEO, abaikan satu isu.
- [ ] Buat pengguna baru, edit, hapus; pastikan Super Admin terakhir dilindungi.
- [ ] Ubah nama situs di Pengaturan, cek header/footer publik.
- [ ] WhatsApp: tambah nomor, cek tombol di publik, hapus.
- [ ] Integrasi: isi GTM, cek script muncul dan banner consent; kosongkan lagi.
- [ ] Analytics: kunjungi halaman publik, cek dashboard bertambah.

## 5. Deploy

Ikuti [`docs/DEPLOY.md`](DEPLOY.md). Urutan ringkas:

1. Siapkan `.env.production` (secret baru untuk rilis ini).
2. Backup database + media sebelum migrasi.
3. `docker compose -f docker-compose.prod.yml up -d --build`.
4. Cek log migrasi dan healthcheck.
5. Buat Super Admin pertama bila database baru.
6. Aktifkan cron analytics dan SEO.

## 6. Verifikasi pasca-deploy

```bash
curl -fsS https://cms.example.com/api/health
curl -fsS -o /dev/null -w "%{http_code}\n" https://cms.example.com/login
curl -fsS https://cms.example.com/sitemap.xml | head
curl -fsS -I https://cms.example.com | grep -i "content-security-policy\|strict-transport"
```

- [ ] `/api/health` mengembalikan `status: ok`.
- [ ] Halaman publik tampil di kedua bahasa.
- [ ] Sitemap memuat artikel terbit.
- [ ] CSP dan HSTS terkirim.
- [ ] Cron terpanggil tanpa 401.

## 7. Tag dan publikasi

Repo ini belum diinisialisasi sebagai git repository. Setelah siap:

```bash
git init
git add .
git commit -m "chore: release v1.0.0"
git tag -a v1.0.0 -m "CMSPlate v1.0.0"
git remote add origin <url-repo>
git push -u origin main --tags
```

- [ ] Tag `v1.0.0` dibuat dan di-push.
- [ ] Rilis internal dicatat di changelog.
- [ ] Arsipkan backup database pasca-rilis.

## 8. Rollback

Jika terjadi masalah produksi:

1. Turunkan container ke image sebelumnya (`docker compose ... up -d` dengan tag lama).
2. Pulihkan database dari backup sebelum migrasi.
3. Pulihkan volume `uploads` bila perlu.
4. Catat insiden dan penyebab di changelog rilis berikutnya.

## 9. Setelah rilis

- [ ] Pantau error log 24 jam pertama.
- [ ] Cek dashboard analytics dan healthcheck berkala.
- [ ] Jadwalkan review keamanan dependensi bulanan.
- [ ] Kumpulkan masukan pengguna untuk roadmap v1.1.
