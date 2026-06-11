import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">
        Iniciar sesión
      </h1>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
