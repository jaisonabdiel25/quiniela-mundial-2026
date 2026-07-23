import { z } from "zod";

// Marcador de un partido: entero de 0 a 99. Compartido por las Server Actions
// que capturan marcadores (predicción del usuario y resultado del admin) para
// que ambas validen exactamente igual.
export const scoreSchema = z.coerce.number().int().min(0).max(99);
