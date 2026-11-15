# Deploy — CMSPlate

Panduan menjalankan CMSPlate di server sendiri dengan Docker.

## 1. Prasyarat

- Docker Engine 24+ dan Docker Compose v2
- Domain dan reverse proxy HTTPS (Caddy, Nginx, atau Traefik)
- Minimal 2 vCPU, 2 GB RAM, 20 GB disk (tumbuh sesuai media)

## 2. Konfigurasi

```bash
cp .env.production.example .env.production
```

Isi wajib:

| Variabel | Cara membuat |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ANALYTICS_SALT` | `openssl rand -hex 32` |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `NEXT_PUBLIC_SITE_URL` | URL publik, mis. `https://cms.example.com` |
| `ADMIN_PATH` | Opsional. Path panel admin, mis. `panel-rahasia-saya` (min. 8 karakter). Default `admin`. |

`DATABASE_URL` di dalam container memakai host `db`. Jika menjalankan app di luar Docker, ganti host-nya.

`ADMIN_PATH` dibaca saat runtime. Setelah diganti, login berada di `https://domain/<ADMIN_PATH>/login`, sedangkan `/admin` dan `/login` lama membalas 404. Jika memakai reverse proxy, simpan path ini di kredensial atau aturan akses yang sama.

Jangan commit `.env.production`.

## 3. Menjalankan

```bash
pnpm docker:prod
docker compose -f docker-compose.prod.yml logs -f app
```

Saat start, container menjalankan `prisma migrate deploy` otomatis, lalu `next start`.
Healthcheck tersedia di `/api/health`.

Membuat Super Admin pertama:

```bash
docker compose -f docker-compose.prod.yml exec app node scripts/create-admin.mjs
```

Perintah itu memakai `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dari env container. Segera ganti password setelah login, atau gunakan halaman Pengguna.

## 4. Reverse proxy (contoh Caddy)

```
cms.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Aplikasi mengirim header keamanan sendiri (CSP, HSTS, X-Frame-Options di produksi). Pastikan proxy meneruskan header `X-Forwarded-For` agar rate limit login dan analytics memakai IP pengunjung.

## 5. Cron terjadwal

Endpoint cron butuh header `x-cron-secret`. Contoh crontab host:

```cron
*/10 * * * * curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://cms.example.com/api/cron/analytics
15 3 * * *   curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://cms.example.com/api/cron/seo
```

- `/api/cron/analytics` — agregasi harian + pemangkasan data melewati retensi.
- `/api/cron/seo` — audit on-site untuk artikel terbit.

Tanpa cron, dashboard analytics tetap menampilkan data mentah, tetapi tabel agregat dan pemangkasan tidak berjalan.

## 6. Backup dan restore

**Database:**

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U simplecms simplecms | gzip > backup-$(date +%F).sql.gz
```

**Media:**

```bash
docker run --rm -v simple-cms_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

> Nama volume mengikuti nama folder repo (`simple-cms_uploads`). Jika folder diganti menjadi `cmsplate`, sesuaikan nama volume pada perintah backup dan restore.

**Restore:**

```bash
gunzip -c backup-2026-11-15.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U simplecms -d simplecms

docker run --rm -v simple-cms_uploads:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/uploads-2026-11-15.tar.gz -C /data"
```

Uji restore minimal sekali sebelum produksi.

## 7. Upgrade

```bash
git pull
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

Migrasi dijalankan otomatis. Jika migrasi gagal, container berhenti dan versi lama tetap tersedia selama image sebelumnya belum dihapus. Rollback: jalankan image sebelumnya lalu pulihkan backup database bila perlu.

## 8. Checklist keamanan

- [ ] `AUTH_SECRET`, `ANALYTICS_SALT`, `CRON_SECRET` acak dan tidak dipakai ulang.
- [ ] `.env.production` hanya bisa dibaca user deploy.
- [ ] HTTPS aktif dan HSTS terkirim.
- [ ] Port database tidak diekspos ke publik.
- [ ] Backup harian + uji restore.
- [ ] Ganti password seed setelah login pertama.
- [ ] `pnpm audit --audit-level=high` bersih pada commit rilis.
- [ ] Rate limit login (5/menit/IP) dan upload (20/menit/user) aktif.
- [ ] Volume `uploads` dipantau agar tidak penuh.

## 9. Troubleshooting

| Gejala | Periksa |
|---|---|
| Container app restart terus | `docker compose logs app`; biasanya `DATABASE_URL` atau secret kosong |
| 502 dari proxy | Port `APP_PORT` dan healthcheck `/api/health` |
| Login selalu gagal | Jam server benar, `AUTH_SECRET` konsisten, akun aktif |
| Analytics kosong | Blokir bot, consent, dan header `X-Forwarded-For` |
| Upload gagal | Izin tulis `/data/uploads` dan batas ukuran di env |
