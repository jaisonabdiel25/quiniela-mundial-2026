"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/actions/auth";

// Sin caracteres ambiguos (0/O, 1/I/L) para dictar el código fácilmente
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createGroup(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede superar 50 caracteres")
    .safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  let group;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      group = await prisma.group.create({
        data: {
          name: parsed.data,
          code: generateCode(),
          ownerId: userId,
          members: { create: { userId } },
        },
      });
      break;
    } catch (e) {
      // P2002: colisión del código único, reintenta con otro
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!group) return { error: "No se pudo generar el grupo, intenta de nuevo" };
  redirect(`/groups/${group.id}`);
}

export async function joinGroup(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requireUserId();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code.length !== 6) {
    return { error: "El código debe tener 6 caracteres" };
  }

  const group = await prisma.group.findUnique({ where: { code } });
  if (!group) {
    return { error: "No existe ningún grupo con ese código" };
  }

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId, groupId: group.id } },
    update: {},
    create: { userId, groupId: group.id },
  });
  redirect(`/groups/${group.id}`);
}

export async function leaveGroup(groupId: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId === userId) return; // el dueño no puede salir, debe eliminar el grupo

  await prisma.groupMember.deleteMany({ where: { userId, groupId } });
  redirect("/");
}

export async function removeMember(groupId: string, memberId: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== userId || memberId === userId) return;

  await prisma.groupMember.deleteMany({
    where: { userId: memberId, groupId },
  });
  revalidatePath(`/groups/${groupId}`);
}

export async function deleteGroup(groupId: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== userId) return;

  await prisma.group.delete({ where: { id: groupId } });
  redirect("/");
}
