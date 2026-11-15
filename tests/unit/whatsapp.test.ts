import { describe, expect, it } from "vitest";
import {
  isScheduleOnline,
  normalizePhone,
  pickWeighted,
  whatsappLink,
} from "@/lib/whatsapp/schedule";

describe("nomor WhatsApp", () => {
  it("menormalkan nomor Indonesia", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("81234567890")).toBe("6281234567890");
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
  });

  it("menolak nomor yang tidak valid", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("021-555-1234")).toBe("62215551234");
  });

  it("membuat tautan wa.me dengan pesan", () => {
    expect(whatsappLink("6281234567890")).toBe("https://wa.me/6281234567890");
    expect(whatsappLink("6281234567890", "Halo dunia")).toContain("text=Halo%20dunia");
  });
});

describe("jadwal online", () => {
  const schedule = { timezone: "Asia/Jakarta", days: [5], start: "09:00", end: "17:00" };

  it("selalu online tanpa jadwal", () => {
    expect(isScheduleOnline(null)).toBe(true);
  });

  it("online pada hari dan jam yang tepat", () => {
    // 2026-05-01 adalah Jumat. 03:00 UTC = 10:00 WIB.
    expect(isScheduleOnline(schedule, new Date("2026-05-01T03:00:00Z"))).toBe(true);
  });

  it("offline di luar jam", () => {
    expect(isScheduleOnline(schedule, new Date("2026-05-01T13:00:00Z"))).toBe(false);
  });

  it("offline pada hari yang tidak dijadwalkan", () => {
    expect(isScheduleOnline(schedule, new Date("2026-05-03T03:00:00Z"))).toBe(false);
  });

  it("mendukung jadwal melewati tengah malam", () => {
    const overnight = { timezone: "Asia/Jakarta", days: [5], start: "22:00", end: "02:00" };
    expect(isScheduleOnline(overnight, new Date("2026-05-01T16:00:00Z"))).toBe(true); // 23:00 WIB
    expect(isScheduleOnline(overnight, new Date("2026-05-01T10:00:00Z"))).toBe(false); // 17:00 WIB
  });
});

describe("pemilihan nomor", () => {
  it("memilih nomor pertama saat random 0", () => {
    const items = [
      { id: "a", weight: 1 },
      { id: "b", weight: 3 },
    ];
    expect(pickWeighted(items, () => 0)?.id).toBe("a");
    expect(pickWeighted(items, () => 0.99)?.id).toBe("b");
  });

  it("mengembalikan null untuk daftar kosong", () => {
    expect(pickWeighted([])).toBeNull();
  });
});
