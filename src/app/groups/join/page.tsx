import { JoinGroupForm } from "@/components/group-forms";

export default function JoinGroupPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        Unirme a un grupo
      </h1>
      <p className="mb-6 text-center text-sm text-zinc-400">
        Pide el código de 6 caracteres al administrador del grupo.
      </p>
      <JoinGroupForm />
    </div>
  );
}
