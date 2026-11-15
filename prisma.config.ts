import { defineConfig, env } from "prisma/config";

// When a Prisma config file is present, the CLI no longer loads `.env`
// automatically. Load it here, but fall back gracefully to the real process
// environment (e.g. Docker) when no `.env` file exists.
try {
  process.loadEnvFile();
} catch {
  // No `.env` file found; rely on the existing environment variables.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
