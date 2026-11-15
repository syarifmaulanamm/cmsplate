import { describe, expect, it } from "vitest";
import { avatarTone, initials, readingTime, timeAgo } from "@/lib/utils";

describe("utils", () => {
  it("membuat inisial dari dua kata pertama", () => {
    expect(initials("Sari Wulandari")).toBe("SW");
    expect(initials("Bagas")).toBe("B");
    expect(initials("  nadia   puspita  ")).toBe("NP");
  });

  it("menghitung waktu baca minimal satu menit", () => {
    expect(readingTime("kata")).toBe(1);
    expect(readingTime(Array.from({ length: 600 }, () => "kata").join(" "))).toBe(3);
  });

  it("memilih nada avatar secara deterministik", () => {
    expect(avatarTone("Sari")).toBe(avatarTone("Sari"));
    expect(avatarTone("Sari")).not.toBe(avatarTone("Bagas"));
  });

  it("menampilkan waktu relatif", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(timeAgo(twoHoursAgo)).toContain("2");
  });
});
