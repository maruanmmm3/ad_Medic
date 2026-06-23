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

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6"];

export default function GraficoCircular() {
  const [data, setData] = useState([]);

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    const { data: maquinas, error } = await supabase
      .from("maquinas")
      .select("recoleccion, limpieza, prueba_can, reparacion, actualizacion, tsc, empaque");

    if (error) {
      console.log(error);
      return;
    }

    const conteo = {
      Recolección: 0,
      Limpieza: 0,
      "Prueba Can": 0,
      Reparación: 0,
      Actualización: 0,
      TSC: 0,
      Empaque: 0,
    };

    maquinas.forEach((m) => {
      if (m.recoleccion) conteo["Recolección"]++;
      if (m.limpieza) conteo["Limpieza"]++;
      if (m.prueba_can) conteo["Prueba Can"]++;
      if (m.reparacion) conteo["Reparación"]++;
      if (m.actualizacion) conteo["Actualización"]++;
      if (m.tsc) conteo["TSC"]++;
      if (m.empaque) conteo["Empaque"]++;
    });

    const formatted = Object.keys(conteo).map((key) => ({
      name: key,
      value: conteo[key],
    }));

    setData(formatted);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-700">
        Estado de Máquinas
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