import "server-only";
import { z } from "zod";

/**
 * Segmen pertama path yang dipakai route publik atau sistem, sehingga tidak
 * boleh dipakai sebagai path admin.
 */
const RESERVED_ADMIN_PATHS = new Set([
  "id",
  "en",
  "api",
  "brand",
  "login",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  /**
   * Path panel admin. Dibaca saat runtime (bukan NEXT_PUBLIC) agar bisa
   * diganti tanpa build ulang. Default `admin` menjaga kompatibilitas.
   */
  ADMIN_PATH: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .toLowerCase()
      .max(64, "ADMIN_PATH maksimal 64 karakter")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "ADMIN_PATH hanya boleh huruf kecil, angka, dan tanda hubung",
      )
      .refine(
        (value) => value === "admin" || value.length >= 8,
        "ADMIN_PATH kustom minimal 8 karakter agar sulit ditebak",
      )
      .refine(
        (value) => !RESERVED_ADMIN_PATHS.has(value),
        "ADMIN_PATH memakai nama yang sudah dipakai route lain",
      )
      .default("admin"),
  ),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  ANALYTICS_SALT: z.string().min(16, "ANALYTICS_SALT minimal 16 karakter"),
  ANALYTICS_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(365),
  CRON_SECRET: z.string().min(8, "CRON_SECRET minimal 8 karakter"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("./data/uploads"),
  MAX_IMAGE_MB: z.coerce.number().int().min(1).max(100).default(10),
  MAX_DOCUMENT_MB: z.coerce.number().int().min(1).max(200).default(20),
  SEED_ADMIN_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().email().optional(),
  ),
  SEED_ADMIN_PASSWORD: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(8).optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Konfigurasi environment tidak valid:\n${issues}\n\nCek file .env.example.`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
