/** Helper teks murni yang aman dipakai di server maupun klien. */

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(text: string) {
  return Math.max(1, Math.round(countWords(text) / 200));
}

/** Apakah konten punya minimal satu link internal (`/...`)? */
export function hasInternalLink(html: string) {
  return /<a[^>]+href="\/[^"]*"/i.test(html);
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
