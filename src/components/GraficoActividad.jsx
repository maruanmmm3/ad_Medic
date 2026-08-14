import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// Configuración: qué tabla tiene qué columnas booleanas de actividad
// y a qué "actividad unificada" corresponde cada columna.
// Si una tabla nueva aparece, solo agrega una entrada aquí.
// ─────────────────────────────────────────────────────────────
const TABLAS = [
  {
    tabla: "bombas",
    columnas: {
      recoleccion: "Recolección",
      limpieza: "Limpieza",
      prueba_can: "Prueba CAN",
      reparacion: "Reparación",
      actualizacion: "Actualización",
      tsc: "TSC",
      empaque: "Empaque",
    },
  },
  {
    tabla: "poles",
    columnas: {
      recoleccion: "Recolección",
      recuperacion: "Recuperación",
      base: "Base",
      pintura: "Pintura",
      limpieza: "Limpieza",
      empaquetado: "Empaque",
    },
  },
  {
    tabla: "fuentespoder",
    columnas: {
      recoleccion: "Recolección",
      reparacion: "Reparación",
      limpieza: "Limpieza",
      etiqueta: "Etiqueta",
      empaquetado: "Empaque",
    },
  },
  {
    tabla: "baterias",
    columnas: {
      mantenimiento: "Mantenimiento",
      prueba: "Prueba",
    },
  },
];

// Lista completa y ordenada de actividades (para las barras apiladas y la leyenda)
const ACTIVIDADES = [
  "Recolección",
  "Limpieza",
  "Reparación",
  "Actualización",
  "Empaque",
  "TSC",
  "Prueba CAN",
  "Base",
  "Pintura",
  "Recuperación",
  "Mantenimiento",
  "Prueba",
  "Etiqueta",
];

// Un color fijo por actividad, para que siempre se vea igual
const COLORES = {
  Recolección: "#0891b2",
  Limpieza: "#0ea5e9",
  Reparación: "#f97316",
  Actualización: "#8b5cf6",
  Empaque: "#22c55e",
  TSC: "#eab308",
  "Prueba CAN": "#ef4444",
  Base: "#64748b",
  Pintura: "#ec4899",
  Recuperación: "#14b8a6",
  Mantenimiento: "#a855f7",
  Prueba: "#f43f5e",
  Etiqueta: "#84cc16",
};

// Devuelve el lunes (00:00:00) y el viernes (23:59:59) de la semana actual
const obtenerSemanaActual = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 = Domingo

  const lunes = new Date(hoy);
  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;
  lunes.setDate(hoy.getDate() + diferencia);
  lunes.setHours(0, 0, 0, 0);

  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  viernes.setHours(23, 59, 59, 999);

  return { lunes, viernes };
};

export default function GraficoActividad() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const obtenerDatos = async () => {
    setCargando(true);
    setError(null);

    try {
      const { lunes, viernes } = obtenerSemanaActual();

      // 1) Traer usuarios para poder mostrar nombre en vez de uuid
      const { data: usuarios, error: errUsuarios } = await supabase
        .from("usuarios")
        .select("id, nombre, nombre_usuario");

      if (errUsuarios) throw errUsuarios;

      const nombrePorId = {};
      usuarios.forEach((u) => {
        nombrePorId[u.id] = u.nombre || u.nombre_usuario || "Sin nombre";
      });

      // 2) Traer de cada tabla solo usuario_id + las columnas booleanas que necesitamos,
      //    filtrando por la fecha de la semana actual (lunes a viernes)
      const consultas = TABLAS.map(({ tabla, columnas }) => {
        const campos = ["usuario_id", "fecha", ...Object.keys(columnas)].join(
          ",",
        );
        return supabase
          .from(tabla)
          .select(campos)
          .gte("fecha", lunes.toISOString())
          .lte("fecha", viernes.toISOString());
      });

      const resultados = await Promise.all(consultas);

      // 3) Acumular conteos por usuario y por actividad unificada
      // acumulado[usuario_id] = { Limpieza: 3, Recolección: 5, ... }
      const acumulado = {};

      resultados.forEach((resultado, i) => {
        const { data: filas, error: errTabla } = resultado;
        if (errTabla) {
          console.error(`Error leyendo ${TABLAS[i].tabla}:`, errTabla);
          return;
        }

        const columnas = TABLAS[i].columnas;

        filas.forEach((fila) => {
          const usuarioId = fila.usuario_id;
          if (!usuarioId) return; // filas sin usuario asignado se ignoran

          if (!acumulado[usuarioId]) acumulado[usuarioId] = {};

          Object.entries(columnas).forEach(([columna, actividad]) => {
            if (fila[columna] === true) {
              acumulado[usuarioId][actividad] =
                (acumulado[usuarioId][actividad] || 0) + 1;
            }
          });
        });
      });

      // 4) Convertir a un array apto para Recharts, uno por usuario
      const filasGrafico = Object.entries(acumulado).map(
        ([usuarioId, conteos]) => {
          const fila = {
            usuario: nombrePorId[usuarioId] || "Desconocido",
          };

          let total = 0;
          ACTIVIDADES.forEach((actividad) => {
            fila[actividad] = conteos[actividad] || 0;
            total += fila[actividad];
          });
          fila.total = total;

          return fila;
        },
      );

      // 5) Ordenar de mayor a menor por total de actividades realizadas
      filasGrafico.sort((a, b) => b.total - a.total);

      setDatos(filasGrafico);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos de actividad.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  if (cargando) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>
        Cargando actividad...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#dc2626" }}>
        {error}
      </div>
    );
  }

  // Solo mostramos en la leyenda/barras las actividades que realmente tienen algún dato,
  // para no saturar el gráfico con categorías vacías.
  const actividadesConDatos = ACTIVIDADES.filter((actividad) =>
    datos.some((fila) => fila[actividad] > 0),
  );

  // Si no hay usuarios con actividad esta semana, no hay nada que graficar
  if (datos.length === 0 || actividadesConDatos.length === 0) {
    return (
      <div
        id="grafico-actividad"
        style={{
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Actividades realizadas por usuario
        </h2>
        <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
          No hay información de la semana
        </p>
      </div>
    );
  }

  return (
    <div
      id="grafico-actividad"
      style={{
        width: "100%",
        background: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        Actividades realizadas por usuario
      </h2>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Total de tareas completadas por cada usuario, desglosado por tipo de
        actividad
      </p>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={datos}
          margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="usuario"
            tick={{ fontSize: 12 }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => `Usuario: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {actividadesConDatos.map((actividad) => (
            <Bar
              key={actividad}
              dataKey={actividad}
              stackId="actividades"
              fill={COLORES[actividad]}
              radius={
                actividad ===
                actividadesConDatos[actividadesConDatos.length - 1]
                  ? [8, 8, 0, 0]
                  : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
