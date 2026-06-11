# ⚽ Quiniela Mundial 2026

Aplicación de quiniela para el Mundial 2026. Los usuarios se registran, crean
grupos o se unen con un código de 6 caracteres, predicen los marcadores de los
104 partidos y compiten en la tabla de posiciones de cada grupo.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL 16** local en Docker
- **Prisma 7** (ORM, migraciones, seed)
- **Auth.js v5** con credenciales (email + contraseña)
- **Tailwind CSS 4**

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Base de datos (Docker, puerto 5435)
npm run db:up

# 3. Dependencias, migraciones y seed (48 equipos + 104 partidos + admin)
npm install
npm run db:migrate
npm run db:seed

# 4. Servidor de desarrollo
npm run dev
```

Abre http://localhost:3000.

## Usuarios y roles

| Rol | Cómo se obtiene | Qué puede hacer |
| --- | --- | --- |
| Usuario | Registro en `/register` | Predecir, crear grupos y unirse con código |
| Admin de grupo | Crear un grupo | Compartir el código, expulsar miembros, eliminar el grupo |
| Admin global | Seed (`admin@quiniela.local` / `ADMIN_SEED_PASSWORD` del `.env`, por defecto `admin123`) | Cargar resultados oficiales y asignar equipos a los cruces de eliminatorias en `/admin` |

## Reglas de la quiniela

- Las predicciones se pueden crear y editar **hasta el inicio de cada partido**.
- **3 puntos** por marcador exacto, **1 punto** por acertar el resultado
  (ganador o empate), 0 en otro caso.
- La predicción es única por usuario y cuenta para todos sus grupos.
- Desempate en la tabla: más marcadores exactos, luego orden alfabético.

## Datos del torneo

`prisma/data/wc2026.json` contiene el fixture real (equipos del sorteo de
diciembre de 2025, fechas/horas en UTC y sedes). Los 32 partidos de la fase
eliminatoria se siembran con placeholders («1° Grupo A», «Ganador P89»…); el
admin global asigna los equipos reales desde `/admin` cuando se definen los
cruces, y a partir de ahí los usuarios pueden predecirlos.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run db:up` / `db:down` | Levantar / detener PostgreSQL en Docker |
| `npm run db:migrate` | Aplicar migraciones de Prisma |
| `npm run db:seed` | Sembrar equipos, partidos y usuario admin (idempotente) |
| `npm run db:studio` | Abrir Prisma Studio para inspeccionar los datos |
