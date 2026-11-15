"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth/password";
import { adminPath } from "@/lib/admin-path";

async function countSuperAdmins(excludeId?: string) {
  return db.user.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

const roles = ["SUPER_ADMIN", "EDITOR", "AUTHOR"] as const;

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  role: z.enum(roles),
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.enum(roles),
  isActive: z.boolean(),
  password: z.string().max(200).optional(),
});

export type UserFormState = {
  errorCode?:
    | "VALIDATION"
    | "EMAIL_TAKEN"
    | "PASSWORD_SHORT"
    | "SELF_DEMOTE"
    | "LAST_SUPER_ADMIN"
    | "SELF_DISABLE"
    | "NOT_FOUND"
    | "UNKNOWN";
};

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole("SUPER_ADMIN");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "password") return { errorCode: "PASSWORD_SHORT" };
    return { errorCode: "VALIDATION" };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return { errorCode: "EMAIL_TAKEN" };

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      },
    });
  } catch (error) {
    console.error("createUser gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  revalidatePath(adminPath("/users"));
  redirect(adminPath("/users"));
}

export async function updateUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const actor = await requireRole("SUPER_ADMIN");

  const id = String(formData.get("id") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
    password: password || undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "password") return { errorCode: "PASSWORD_SHORT" };
    return { errorCode: "VALIDATION" };
  }

  const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return { errorCode: "NOT_FOUND" };

  const isSelf = actor.id === user.id;

  if (isSelf && parsed.data.role !== "SUPER_ADMIN") {
    return { errorCode: "SELF_DEMOTE" };
  }
  if (isSelf && !parsed.data.isActive) {
    return { errorCode: "SELF_DISABLE" };
  }

  if (user.role === "SUPER_ADMIN" && parsed.data.role !== "SUPER_ADMIN") {
    const remaining = await countSuperAdmins(user.id);
    if (remaining === 0) return { errorCode: "LAST_SUPER_ADMIN" };
  }

  try {
    await db.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        ...(parsed.data.password
          ? { passwordHash: await hashPassword(parsed.data.password) }
          : {}),
      },
    });
  } catch (error) {
    console.error("updateUser gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  revalidatePath(adminPath("/users"));
  revalidatePath(adminPath(`/users/${id}`));
  redirect(adminPath(`/users/${id}`));
}

export type DeleteUserResult = {
  ok: boolean;
  code?: "NOT_FOUND" | "SELF" | "LAST_SUPER_ADMIN" | "IN_USE" | "UNKNOWN";
};

export async function deleteUser(id: string): Promise<DeleteUserResult> {
  const actor = await requireRole("SUPER_ADMIN");

  if (actor.id === id) return { ok: false, code: "SELF" };

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true, _count: { select: { posts: true, media: true } } },
  });
  if (!user) return { ok: false, code: "NOT_FOUND" };

  if (user.role === "SUPER_ADMIN") {
    const remaining = await countSuperAdmins(id);
    if (remaining === 0) return { ok: false, code: "LAST_SUPER_ADMIN" };
  }

  if (user._count.posts > 0 || user._count.media > 0) {
    return { ok: false, code: "IN_USE" };
  }

  try {
    await db.user.delete({ where: { id } });
    revalidatePath(adminPath("/users"));
    return { ok: true };
  } catch (error) {
    console.error("deleteUser gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}
