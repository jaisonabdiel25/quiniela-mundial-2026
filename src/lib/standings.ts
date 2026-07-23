// Comparadores de orden puros (sin BD), extraídos de queries.ts para poder
// testearlos de forma unitaria. Aceptan solo los campos que necesitan, así que
// sirven tanto para las posiciones de grupo como para los "mejores terceros".

// Orden de una tabla de grupo: más puntos → mejor diferencia de goles →
// más goles a favor → nombre alfabético.
export function compareStandings(
  a: { points: number; goalDiff: number; goalsFor: number; name: string },
  b: { points: number; goalDiff: number; goalsFor: number; name: string }
): number {
  return (
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.name.localeCompare(b.name)
  );
}

// Orden de la tabla de participantes de un grupo: más puntos totales →
// más marcadores exactos.
export function compareLeaderboard(
  a: { points: number; exactCount: number },
  b: { points: number; exactCount: number }
): number {
  return b.points - a.points || b.exactCount - a.exactCount;
}
