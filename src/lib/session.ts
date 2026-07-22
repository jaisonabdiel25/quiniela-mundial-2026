import { cache } from "react";
import { auth } from "@/auth";

// Deduplica la lectura de sesión dentro de un mismo render (request): Nav,
// MyGroups y la página comparten una sola verificación del JWT en lugar de tres.
// React `cache()` memoiza por request, así que llamar getSession() varias veces
// en el mismo árbol de render no repite el trabajo de decodificar el token.
export const getSession = cache(() => auth());
