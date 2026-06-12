import { formatPanama } from "@/lib/timezone";

const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export function KickoffTime({ date }: { date: Date | string }) {
  const d = new Date(date);
  // Siempre en hora de Panamá, igual en servidor y navegador (sin hydration mismatch).
  return <time dateTime={d.toISOString()}>{formatPanama(d, FORMAT)}</time>;
}
