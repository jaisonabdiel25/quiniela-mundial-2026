"use client";

const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export function KickoffTime({ date }: { date: Date | string }) {
  const d = new Date(date);
  // suppressHydrationWarning: el servidor formatea en UTC y el navegador en hora local
  return (
    <time suppressHydrationWarning dateTime={d.toISOString()}>
      {d.toLocaleString("es", FORMAT)}
    </time>
  );
}
