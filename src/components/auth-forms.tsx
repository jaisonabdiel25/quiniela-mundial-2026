"use client";

import { useActionState } from "react";
import { authenticate, register, type FormState } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none";
const buttonClass =
  "w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    authenticate,
    undefined
  );
  return (
    <form action={formAction} className="space-y-4">
      <input name="email" type="email" placeholder="Correo" required className={inputClass} />
      <input name="password" type="password" placeholder="Contraseña" required className={inputClass} />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Entrando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    register,
    undefined
  );
  return (
    <form action={formAction} className="space-y-4">
      <input name="name" type="text" placeholder="Nombre" required className={inputClass} />
      <input name="email" type="email" placeholder="Correo" required className={inputClass} />
      <input
        name="password"
        type="password"
        placeholder="Contraseña (mínimo 6 caracteres)"
        required
        minLength={6}
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creando cuenta..." : "Registrarme"}
      </button>
    </form>
  );
}
