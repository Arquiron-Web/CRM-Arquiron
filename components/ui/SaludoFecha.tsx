"use client";

import { useSyncExternalStore } from "react";

function getSaludo(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

const subscribe = () => () => {};

// Cadena primitiva "hora|fecha": estable entre lecturas, así React no
// re-renderiza sin necesidad.
const getSnapshot = () => {
  const d = new Date();
  const fecha = d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${d.getHours()}|${fecha}`;
};

const getServerSnapshot = () => "";

/**
 * Saludo y fecha del encabezado. Dependen de la hora actual, y las páginas
 * del dashboard se prerenderizan estáticas en el build: si se calculan en el
 * render, el HTML trae la hora del deploy y no coincide con la del navegador
 * al hidratar (error #418). useSyncExternalStore usa el snapshot de servidor
 * (saludo neutro) durante la hidratación y pasa al valor real justo después.
 */
export function SaludoFecha({ nombre }: { nombre: string }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hora, fecha] = snapshot ? snapshot.split("|") : [null, ""];

  return (
    <>
      <p className="text-base font-bold text-[#1B3A5C]">
        {hora !== null ? getSaludo(Number(hora)) : "Hola"}, {nombre}
      </p>
      <p className="min-h-4 text-xs text-gray-400">{fecha}</p>
    </>
  );
}
