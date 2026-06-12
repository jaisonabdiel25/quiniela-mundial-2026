// Toda la app muestra y captura horas en zona de Panamá.
// America/Panama es UTC-5 todo el año (no tiene horario de verano),
// por eso el offset fijo es seguro para cualquier fecha.
export const PANAMA_TZ = "America/Panama";
export const PANAMA_OFFSET = "-05:00";

// Formatea un instante (Date/UTC) como hora de Panamá, sin importar la
// zona del servidor (UTC en Railway) ni la del navegador.
export function formatPanama(
  date: Date | string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleString("es", { ...options, timeZone: PANAMA_TZ });
}

// Convierte un instante UTC al valor de un <input type="datetime-local">
// expresado en hora de Panamá: "YYYY-MM-DDTHH:mm".
export function toPanamaDatetimeLocal(date: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PANAMA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(date));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Interpreta un string "YYYY-MM-DDTHH:mm" (hora de Panamá, viene del input)
// como instante UTC. Devuelve null si el formato es inválido.
export function parsePanamaDatetimeLocal(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/.exec(value);
  if (!match) return null;
  const date = new Date(`${match[1]}:00${PANAMA_OFFSET}`);
  return isNaN(date.getTime()) ? null : date;
}
