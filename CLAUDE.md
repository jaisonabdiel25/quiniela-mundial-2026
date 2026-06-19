# CLAUDE.md

Este archivo guía a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

@AGENTS.md

> La línea de arriba no es decoración: este repo fija **Next.js 16**, **React 19**, **Prisma 7** y **Auth.js v5 (beta)**. Las APIs y convenciones de archivos difieren de versiones anteriores. Lee `node_modules/next/dist/docs/` antes de escribir código del framework.

## Qué es

Una quiniela del Mundial 2026. Los usuarios se registran, crean o se unen a grupos privados con un código de 6 caracteres, predicen los marcadores de los 104 partidos y compiten en la tabla de posiciones de cada grupo. La interfaz y todo el texto de dominio están en **español** — manténlo así al agregar texto visible para el usuario. Las horas siempre se muestran/capturan en **hora de Panamá** (UTC-5, sin horario de verano) sin importar la zona del servidor/navegador — usa los helpers de [src/lib/timezone.ts](src/lib/timezone.ts), nunca formateo crudo de `Date`.

## Comandos

```bash
npm run dev              # servidor de desarrollo de Next (Turbopack) en :3000
npm run build            # prisma generate && next build
npm run lint             # eslint

npm run db:up            # levantar PostgreSQL 16 en Docker (puerto host 5435)
npm run db:down          # detenerlo
npm run db:migrate       # prisma migrate dev (crear + aplicar migración)
npm run db:deploy        # prisma migrate deploy (estilo prod, sin nueva migración)
npm run db:seed          # seed idempotente: 48 equipos + 104 partidos + admin
npm run db:studio        # Prisma Studio

npm run db:simulate          # marcadores aleatorios para los partidos de grupo + recalcular puntos
npm run db:simulate:reset    # deshacer la simulación
npm run db:reset:knockout    # limpiar las asignaciones de equipos de eliminatorias (vuelven a placeholders)
```

**No hay suite de pruebas.** La verificación es manual con el servidor de desarrollo, `db:simulate` y Prisma Studio.

Puesta en marcha inicial: `cp .env.example .env`, `npm run db:up`, `npm install`, `npm run db:migrate`, `npm run db:seed`. El admin por defecto es `admin@quiniela.local` / `admin123` (configurable con las variables `ADMIN_SEED_*`).

## Arquitectura

**Stack:** Next.js 16 App Router · React 19 Server Components · Prisma 7 (adaptador pg) · Auth.js v5 (JWT, credenciales) · Tailwind 4.

### El cliente de Prisma vive en una ruta personalizada
El cliente generado se emite a `src/generated/prisma/` (ver el bloque `generator` en [prisma/schema.prisma](prisma/schema.prisma)), **no** en `@prisma/client`. Importa los tipos y el cliente desde `@/generated/prisma/client`. El singleton compartido es [src/lib/prisma.ts](src/lib/prisma.ts) (usa el adaptador `PrismaPg` + cacheo en `globalThis`). `src/generated/` es código generado — nunca lo edites a mano; ejecuta `prisma generate` (o `npm run build`) tras cambiar el schema.

### Auth está dividido en tres archivos por compatibilidad con Edge
- [src/auth.config.ts](src/auth.config.ts) — config sin dependencias de BD (autorización de rutas, callbacks JWT/session). Segura para el middleware Edge. El callback `authorized` es el guardia de rutas: fuerza el login, redirige a los usuarios autenticados fuera de `/login`/`/register` y restringe `/admin` a `role === "ADMIN"`.
- [src/auth.ts](src/auth.ts) — config completa (importa el provider Credentials + bcrypt + Prisma). Usa `auth()` desde aquí en Server Components/Actions.
- [src/proxy.ts](src/proxy.ts) — el middleware (llamado `proxy`, convención de Next 16 aquí), conecta `authConfig` y el matcher de rutas.

`role` e `id` se propagan de BD → JWT → session vía los callbacks; `src/types/next-auth.d.ts` extiende los tipos de la sesión.

### Las mutaciones de datos van por Server Actions, no por API routes
Todas las escrituras viven en [src/lib/actions/](src/lib/actions/) (archivos `"use server"`): `auth.ts`, `groups.ts`, `predictions.ts`, `admin.ts`. La única API route es el catch-all de Auth.js. Convenciones comunes:
- Validar la entrada con **Zod**; devolver un objeto `FormState`/`PredictionState` `{ ok }` / `{ error }` para formularios con `useActionState`.
- Re-verificar la autorización en el servidor cada vez (`requireUserId`, `requireAdmin`) — nunca confiar en el cliente.
- Llamar `revalidatePath(...)` para las rutas afectadas tras una escritura.

### Reglas de dominio (dónde está la lógica real)
- **Bloqueo:** las predicciones solo se pueden crear/editar hasta el `kickoff` (`match.kickoff <= now`). Se aplica en `savePrediction` y se expone vía `isLocked` en [src/lib/match-utils.ts](src/lib/match-utils.ts). `getMemberPredictions` también depende de esto — solo expone las predicciones de otros miembros para partidos que ya empezaron.
- **Puntaje:** 3 pts marcador exacto, 1 pt resultado correcto (signo de la diferencia de goles), 0 en otro caso. Esta fórmula está duplicada como SQL crudo en `admin.saveResult` y `simulate-groups.ts` — mantenlas sincronizadas si la cambias.
- **Posiciones y tablas:** se calculan al vuelo en [src/lib/queries.ts](src/lib/queries.ts) (`getGroupStandings`, `getBestThirds`, `getGroupLeaderboard`). Desempate de grupo: puntos → diferencia de goles → goles a favor → nombre. Desempate de tabla: puntos → cantidad de marcadores exactos. El `validFrom` opcional de un grupo limita su tabla a los partidos que arrancan en/después de esa hora.
- **Avance del cuadro:** los partidos de eliminatoria se siembran con placeholders (`"1° Grupo A"`, `"Ganador P89"`, etc., traducidos del inglés en `seed.ts`). El admin los resuelve a equipos reales en `/admin` vía `autoAssignFromGroups` (16avos desde las posiciones finales) y `autoAssignKnockoutRound` (rondas posteriores desde ganadores/perdedores previos). Los empates y los slots de tercer puesto se dejan para asignación manual.

### Banderas de equipos
Las banderas se renderizan con `flag-icons` (CSS), que necesita códigos ISO. Los partidos guardan códigos FIFA; [src/lib/flags.ts](src/lib/flags.ts) mapea FIFA → ISO (nota `gb-sct`/`gb-eng` para Escocia/Inglaterra). Actualiza este mapa si cambian los equipos.

### Datos del seed
[prisma/data/wc2026.json](prisma/data/wc2026.json) es la fuente de verdad del fixture (kickoffs en UTC, sedes, estructura de grupos/eliminatorias). `seed.ts` hace upsert de equipos + partidos desde ahí (idempotente) y traduce los placeholders del inglés al español.
