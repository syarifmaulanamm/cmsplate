/** Ganti `{nama}` pada template dengan nilai dari variabel. */
export function formatMessage(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

/** 1 → "1 artikel", 12 → "12 artikel". Struktur sederhana untuk dua bahasa. */
export function plural(
  count: number,
  forms: { one: string; other: string },
  template: string,
): string {
  const form = count === 1 ? forms.one : forms.other;
  return formatMessage(template, { count, form });
}
