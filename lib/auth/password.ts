import "server-only";
import { hash, compare } from "bcryptjs";

const COST = 12;

export async function hashPassword(plain: string) {
  return hash(plain, COST);
}

export async function verifyPassword(plain: string, passwordHash: string) {
  return compare(plain, passwordHash);
}

/** Aturan password minimal: 8 karakter, ada huruf dan angka. */
export function isStrongEnough(password: string) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
