import { describe, expect, it } from "vitest";
import { canEditPost, canManageUsers, canPublish, hasRole } from "@/lib/roles";

describe("peran dan izin", () => {
  it("menghormati hierarki AUTHOR < EDITOR < SUPER_ADMIN", () => {
    expect(hasRole("AUTHOR", "AUTHOR")).toBe(true);
    expect(hasRole("AUTHOR", "EDITOR")).toBe(false);
    expect(hasRole("EDITOR", "AUTHOR")).toBe(true);
    expect(hasRole("EDITOR", "SUPER_ADMIN")).toBe(false);
    expect(hasRole("SUPER_ADMIN", "EDITOR")).toBe(true);
  });

  it("hanya Super Admin yang dapat mengelola pengguna", () => {
    expect(canManageUsers("SUPER_ADMIN")).toBe(true);
    expect(canManageUsers("EDITOR")).toBe(false);
    expect(canManageUsers("AUTHOR")).toBe(false);
  });

  it("hanya Editor ke atas yang dapat menerbitkan", () => {
    expect(canPublish("AUTHOR")).toBe(false);
    expect(canPublish("EDITOR")).toBe(true);
    expect(canPublish("SUPER_ADMIN")).toBe(true);
  });

  it("Author hanya boleh mengubah artikelnya sendiri", () => {
    expect(canEditPost("AUTHOR", "user-1", "user-1")).toBe(true);
    expect(canEditPost("AUTHOR", "user-1", "user-2")).toBe(false);
    expect(canEditPost("EDITOR", "user-1", "user-2")).toBe(true);
    expect(canEditPost("SUPER_ADMIN", "user-1", "user-2")).toBe(true);
  });
});
