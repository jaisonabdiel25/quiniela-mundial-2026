"use client";

import { useActionState } from "react";
import { createGroup, joinGroup, setGroupValidFrom } from "@/lib/actions/groups";
import type { FormState } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none";
const buttonClass =
  "w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50";

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

export function ValidFromForm({
  groupId,
  validFrom,
}: {
  groupId: string;
  validFrom: Date | null;
}) {
  const action = setGroupValidFrom.bind(null, groupId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const currentValue = validFrom
    ? new Date(new Date(validFrom).getTime() - new Date(validFrom).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-2">
      <label className="block text-sm text-slate-300">
        Contar partidos desde
      </label>
      <div className="flex gap-2">
        <input
          name="validFrom"
          type="datetime-local"
          defaultValue={currentValue}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {validFrom && (
          <button
            type="submit"
            name="validFrom"
            value=""
            disabled={pending}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-50"
          >
            Quitar límite
          </button>
        )}
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
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
