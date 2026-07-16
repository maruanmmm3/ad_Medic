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

export default function GraficoCircularPoles() {
  const [data, setData] = useState([]);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    const { data: poles, error } = await supabase
      .from("poles")
      .select(
        "recoleccion, recuperacion, base, pintura, limpieza, empaquetado",
      );

    if (error) {
      console.log(error);
      return;
    }

    const etapas = [
      { campo: "recoleccion", nombre: "Recolección" },
      { campo: "recuperacion", nombre: "Recuperación" },
      { campo: "base", nombre: "Base" },
      { campo: "pintura", nombre: "Pintura" },
      { campo: "limpieza", nombre: "Limpieza" },
      { campo: "empaquetado", nombre: "Empaquetado" },
    ];

    const conteo = {};

    etapas.forEach((e) => (conteo[e.nombre] = 0));

    poles.forEach((p) => {
      for (let i = etapas.length - 1; i >= 0; i--) {
        if (p[etapas[i].campo]) {
          conteo[etapas[i].nombre]++;
          break;
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
      <h2 className="text-xl font-bold mb-4 text-slate-700">Estado de Pole</h2>

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
