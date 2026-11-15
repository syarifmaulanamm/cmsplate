import "server-only";
import sharp from "sharp";
import { putObject, storageKeyFor } from "@/lib/media/storage";

export type ImageVariant = {
  label: string;
  path: string;
  width: number;
  height: number;
  format: string;
};

const VARIANT_WIDTHS = [
  { label: "thumb", width: 320 },
  { label: "medium", width: 768 },
  { label: "large", width: 1280 },
] as const;

export async function inspectImage(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    format: metadata.format ?? null,
  };
}

/** Varian hanya dibuat untuk gambar raster. SVG, GIF animasi, dan PDF dilewati. */
export async function createImageVariants(
  buffer: Buffer,
  hash: string,
  mimeType: string,
): Promise<ImageVariant[]> {
  const raster = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!raster.includes(mimeType)) return [];

  const variants: ImageVariant[] = [];

  for (const variant of VARIANT_WIDTHS) {
    try {
      const pipeline = sharp(buffer).rotate().resize({
        width: variant.width,
        withoutEnlargement: true,
      });
      const output = await pipeline.webp({ quality: 82 }).toBuffer();
      const info = await sharp(output).metadata();
      const key = storageKeyFor(hash, "image/webp", `-${variant.label}`);
      await putObject(key, output);
      variants.push({
        label: variant.label,
        path: key,
        width: info.width ?? variant.width,
        height: info.height ?? variant.width,
        format: "webp",
      });
    } catch (error) {
      console.error(`Gagal membuat varian ${variant.label}`, error);
    }
  }

  return variants;
}
