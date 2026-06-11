"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function register(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese correo" };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  // Inicia sesión automáticamente y redirige al dashboard
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/",
  });
}

export async function authenticate(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos" };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
