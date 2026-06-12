import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata = {
  title: "Reglas del juego · Quiniela Mundial 2026",
};

function Rule({
  points,
  title,
  children,
  color,
}: {
  points: string;
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-bold ${color}`}
      >
        {points}
      </span>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-400">{children}</p>
      </div>
    </div>
  );
}

export default async function ReglasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reglas del juego</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cómo funciona la quiniela y cómo se reparten los puntos.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sky-400">Puntuación</h2>
        <Rule points="3" title="Marcador exacto" color="bg-sky-700 text-white">
          Aciertas el resultado exacto del partido. Por ejemplo, predices 2-1 y
          el partido termina 2-1.
        </Rule>
        <Rule points="1" title="Resultado acertado" color="bg-violet-700 text-white">
          Aciertas quién gana (o el empate) pero no el marcador exacto. Por
          ejemplo, predices 2-1 y el partido termina 3-0: ambos son victoria
          local.
        </Rule>
        <Rule points="0" title="Sin acierto" color="bg-slate-800 text-slate-400">
          La predicción no coincide ni con el marcador ni con el ganador.
        </Rule>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sky-400">Predicciones</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Puedes predecir el marcador de cualquier partido hasta el momento
            del pitazo inicial. Una vez que el partido comienza, la predicción
            queda bloqueada.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Puedes editar tu predicción cuantas veces quieras antes de que
            inicie el partido.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            En las fases eliminatorias, podrás predecir cuando se definan los
            equipos clasificados.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Todas las horas se muestran en hora de Panamá.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sky-400">Tabla de posiciones</h2>
        <p className="text-sm text-slate-300">
          Dentro de cada grupo, los jugadores se ordenan así:
        </p>
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="font-semibold text-white">1.</span>
            Mayor cantidad de puntos totales.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-white">2.</span>
            En caso de empate, quien tenga más marcadores exactos.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-sky-400">Grupos</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Crea un grupo y comparte su código de 6 caracteres para que otros se
            unan.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Tus puntos son los mismos en todos los grupos a los que perteneces:
            se calculan una sola vez por partido.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            El administrador de un grupo puede expulsar miembros y definir desde
            qué fecha cuentan los partidos en la tabla (útil para grupos que
            empiezan tarde).
          </li>
        </ul>
      </section>
    </div>
  );
}
