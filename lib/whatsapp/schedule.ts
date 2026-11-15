export type WhatsappSchedule = {
  timezone: string;
  days: number[];
  start: string;
  end: string;
};

/** Normalisasi nomor Indonesia ke format internasional tanpa tanda plus. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;

  let value = digits;
  if (value.startsWith("0")) value = `62${value.slice(1)}`;
  else if (value.startsWith("8")) value = `62${value}`;
  else if (!value.startsWith("62")) return null;

  if (value.length < 10 || value.length > 15) return null;
  return value;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minutesOf(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

/** Apakah jadwal sedang online? `null` berarti selalu online. */
export function isScheduleOnline(schedule: WhatsappSchedule | null, now = new Date()) {
  if (!schedule) return true;

  let weekday = "Mon";
  let hour = 0;
  let minute = 0;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: schedule.timezone || "Asia/Jakarta",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
    hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
    minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  } catch {
    return true;
  }

  const dayIndex = WEEKDAYS.indexOf(weekday);
  if (!schedule.days.includes(dayIndex)) return false;
  if (hour === 24) hour = 0;

  const current = hour * 60 + minute;
  const start = minutesOf(schedule.start);
  const end = minutesOf(schedule.end);

  if (start <= end) return current >= start && current <= end;
  // Jadwal melewati tengah malam, mis. 22:00–02:00.
  return current >= start || current <= end;
}

/** Pilih satu nomor secara acak berbobot. */
export function pickWeighted<T extends { weight: number }>(
  items: T[],
  random: () => number = Math.random,
): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  let threshold = random() * total;

  for (const item of items) {
    threshold -= Math.max(1, item.weight);
    if (threshold <= 0) return item;
  }

  return items[items.length - 1] ?? null;
}

export function whatsappLink(phone: string, message?: string) {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
