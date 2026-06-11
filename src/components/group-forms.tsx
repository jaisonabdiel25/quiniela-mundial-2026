"use client";

import { useActionState } from "react";
import { createGroup, joinGroup } from "@/lib/actions/groups";
import type { FormState } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none";
const buttonClass =
  "w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50";

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createGroup,
    undefined
  );
  return (
    <form action={formAction} className="space-y-4">
      <input
        name="name"
        type="text"
        placeholder="Nombre del grupo (ej. Oficina 2026)"
        required
        minLength={3}
        maxLength={50}
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creando..." : "Crear grupo"}
      </button>
    </form>
  );
}

export function JoinGroupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    joinGroup,
    undefined
  );
  return (
    <form action={formAction} className="space-y-4">
      <input
        name="code"
        type="text"
        placeholder="Código de 6 caracteres"
        required
        minLength={6}
        maxLength={6}
        className={`${inputClass} uppercase tracking-widest`}
        autoCapitalize="characters"
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Buscando..." : "Unirme al grupo"}
      </button>
    </form>
  );
}
