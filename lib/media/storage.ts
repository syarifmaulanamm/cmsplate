import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const root = path.resolve(env.UPLOAD_DIR);

export function storageRoot() {
  return root;
}

function absolutePath(key: string) {
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("INVALID_PATH");
  }
  return target;
}

export async function putObject(key: string, data: Buffer) {
  const target = absolutePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getObject(key: string) {
  return readFile(absolutePath(key));
}

export async function deleteObject(key: string) {
  await unlink(absolutePath(key)).catch(() => undefined);
}

export function publicMediaUrl(key: string) {
  return `/api/media/${key}`;
}

export function hashBuffer(data: Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export function extensionFor(mimeType: string) {
  return EXTENSION_BY_MIME[mimeType] ?? "bin";
}

const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME).map(([mime, ext]) => [ext, mime]),
);

export function mimeForExtension(ext: string) {
  return MIME_BY_EXTENSION[ext.toLowerCase()] ?? "application/octet-stream";
}

export function storageKeyFor(hash: string, mimeType: string, suffix = "") {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ext = extensionFor(mimeType);
  return `${year}/${month}/${hash}${suffix}.${ext}`;
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

export const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf"]);
