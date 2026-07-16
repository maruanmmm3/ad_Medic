import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

export default function GraficoCircularFuentePoder() {
  const [data, setData] = useState([]);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    const { data: fuentes, error } = await supabase
      .from("fuentespoder")
      .select("recoleccion, reparacion, limpieza, etiqueta, empaquetado");

    if (error) {
      console.log(error);
      return;
    }

    const etapas = [
      { campo: "recoleccion", nombre: "Recolección" },
      { campo: "reparacion", nombre: "Reparación" },
      { campo: "limpieza", nombre: "Limpieza" },
      { campo: "etiqueta", nombre: "Etiqueta" },
      { campo: "empaquetado", nombre: "Empaquetado" },
    ];

    const conteo = {};

    etapas.forEach((e) => (conteo[e.nombre] = 0));

    fuentes.forEach((f) => {
      for (let i = etapas.length - 1; i >= 0; i--) {
        if (f[etapas[i].campo]) {
          conteo[etapas[i].nombre]++;
          break; // Solo cuenta una vez, en la última etapa alcanzada
        }
      }
    });

    const formatted = etapas.map((e) => ({
      name: e.nombre,
      value: conteo[e.nombre],
    }));

    setData(formatted);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-700">
        Estado de Fuente Poder
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            nameKey="name"
            label
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
