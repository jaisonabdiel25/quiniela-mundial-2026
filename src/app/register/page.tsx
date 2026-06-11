import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">
        Crear cuenta
      </h1>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-400 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
