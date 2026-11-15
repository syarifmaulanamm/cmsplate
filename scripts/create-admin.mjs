import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password minimal 8 karakter.");
  process.exit(1);
}

const db = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", isActive: true, passwordHash },
    create: { email, name: "Super Admin", passwordHash, role: "SUPER_ADMIN" },
  });

  console.info(`Super Admin siap: ${email}`);
} catch (error) {
  console.error("Gagal membuat admin:", error);
  process.exit(1);
} finally {
  await db.$disconnect();
}
