import { CreateGroupForm } from "@/components/group-forms";

export default function NewGroupPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-2 text-center text-2xl font-bold text-white">
        Crear grupo
      </h1>
      <p className="mb-6 text-center text-sm text-slate-400">
        Serás el administrador y recibirás un código para invitar a tus amigos.
      </p>
      <CreateGroupForm />
    </div>
  );
}
