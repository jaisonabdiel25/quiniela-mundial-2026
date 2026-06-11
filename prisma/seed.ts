import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Stage } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Nombre en español y bandera por código FIFA (48 clasificados, sorteo dic. 2025)
const TEAMS: Record<string, { name: string; flag: string }> = {
  MEX: { name: "México", flag: "🇲🇽" },
  RSA: { name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { name: "Corea del Sur", flag: "🇰🇷" },
  CZE: { name: "Chequia", flag: "🇨🇿" },
  CAN: { name: "Canadá", flag: "🇨🇦" },
  BIH: { name: "Bosnia y Herzegovina", flag: "🇧🇦" },
  QAT: { name: "Catar", flag: "🇶🇦" },
  SUI: { name: "Suiza", flag: "🇨🇭" },
  BRA: { name: "Brasil", flag: "🇧🇷" },
  MAR: { name: "Marruecos", flag: "🇲🇦" },
  HAI: { name: "Haití", flag: "🇭🇹" },
  SCO: { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "Estados Unidos", flag: "🇺🇸" },
  PAR: { name: "Paraguay", flag: "🇵🇾" },
  AUS: { name: "Australia", flag: "🇦🇺" },
  TUR: { name: "Turquía", flag: "🇹🇷" },
  GER: { name: "Alemania", flag: "🇩🇪" },
  CUW: { name: "Curazao", flag: "🇨🇼" },
  CIV: { name: "Costa de Marfil", flag: "🇨🇮" },
  ECU: { name: "Ecuador", flag: "🇪🇨" },
  NED: { name: "Países Bajos", flag: "🇳🇱" },
  JPN: { name: "Japón", flag: "🇯🇵" },
  SWE: { name: "Suecia", flag: "🇸🇪" },
  TUN: { name: "Túnez", flag: "🇹🇳" },
  BEL: { name: "Bélgica", flag: "🇧🇪" },
  EGY: { name: "Egipto", flag: "🇪🇬" },
  IRN: { name: "Irán", flag: "🇮🇷" },
  NZL: { name: "Nueva Zelanda", flag: "🇳🇿" },
  ESP: { name: "España", flag: "🇪🇸" },
  CPV: { name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { name: "Arabia Saudita", flag: "🇸🇦" },
  URU: { name: "Uruguay", flag: "🇺🇾" },
  FRA: { name: "Francia", flag: "🇫🇷" },
  SEN: { name: "Senegal", flag: "🇸🇳" },
  IRQ: { name: "Irak", flag: "🇮🇶" },
  NOR: { name: "Noruega", flag: "🇳🇴" },
  ARG: { name: "Argentina", flag: "🇦🇷" },
  ALG: { name: "Argelia", flag: "🇩🇿" },
  AUT: { name: "Austria", flag: "🇦🇹" },
  JOR: { name: "Jordania", flag: "🇯🇴" },
  POR: { name: "Portugal", flag: "🇵🇹" },
  COD: { name: "RD Congo", flag: "🇨🇩" },
  UZB: { name: "Uzbekistán", flag: "🇺🇿" },
  COL: { name: "Colombia", flag: "🇨🇴" },
  ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { name: "Croacia", flag: "🇭🇷" },
  GHA: { name: "Ghana", flag: "🇬🇭" },
  PAN: { name: "Panamá", flag: "🇵🇦" },
};

type RawTeam = { code?: string; placeholder?: string };
type RawMatch = {
  matchNumber: number;
  kickoffUTC: string;
  team1: RawTeam;
  team2: RawTeam;
  venue: string;
  stage: keyof typeof Stage;
  group?: string;
};
type WcData = { groups: Record<string, string[]>; matches: RawMatch[] };

function translatePlaceholder(text: string): string {
  return text
    .replace(/Winner Group (\w)/, "1° Grupo $1")
    .replace(/Runner-up Group (\w)/, "2° Grupo $1")
    .replace(/3rd Group ([\w/]+)/, "3° Grupo $1")
    .replace(/Winner Match (\d+)/, "Ganador P$1")
    .replace(/Loser Match (\d+)/, "Perdedor P$1");
}

async function main() {
  const data: WcData = JSON.parse(
    readFileSync(join(__dirname, "data", "wc2026.json"), "utf-8")
  );

  // Equipos
  const teamIdByCode = new Map<string, number>();
  for (const [letter, codes] of Object.entries(data.groups)) {
    for (const code of codes) {
      const info = TEAMS[code];
      if (!info) throw new Error(`Equipo sin traducción: ${code}`);
      const team = await prisma.team.upsert({
        where: { fifaCode: code },
        update: { name: info.name, flagEmoji: info.flag, groupLetter: letter },
        create: {
          fifaCode: code,
          name: info.name,
          flagEmoji: info.flag,
          groupLetter: letter,
        },
      });
      teamIdByCode.set(code, team.id);
    }
  }

  // Partidos
  for (const m of data.matches) {
    const homeTeamId = m.team1.code ? teamIdByCode.get(m.team1.code) : null;
    const awayTeamId = m.team2.code ? teamIdByCode.get(m.team2.code) : null;
    const fields = {
      stage: Stage[m.stage],
      groupLetter: m.group ?? null,
      homeTeamId,
      awayTeamId,
      homePlaceholder: m.team1.placeholder
        ? translatePlaceholder(m.team1.placeholder)
        : null,
      awayPlaceholder: m.team2.placeholder
        ? translatePlaceholder(m.team2.placeholder)
        : null,
      kickoff: new Date(m.kickoffUTC),
      venue: m.venue,
    };
    await prisma.match.upsert({
      where: { matchNumber: m.matchNumber },
      update: fields,
      create: { matchNumber: m.matchNumber, ...fields },
    });
  }

  // Usuario administrador
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@quiniela.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  const counts = {
    equipos: await prisma.team.count(),
    partidos: await prisma.match.count(),
  };
  console.log(`Seed OK → ${counts.equipos} equipos, ${counts.partidos} partidos, admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
