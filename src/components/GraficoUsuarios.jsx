import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export default function GraficoUsuarios() {
  const [data, setData] = useState([]);

  const obtenerDatos = async () => {
    // Traemos historial junto con el nombre del usuario
    const { data: historial, error } = await supabase
      .from("historial_actividades")
      .select("usuario_id, usuarios(nombre)");

    if (error) {
      console.error("Error al obtener historial:", error);
      return;
    }

    // Contar actividades por usuario usando su nombre
    const conteo = {};
    historial.forEach(({ usuario_id, usuarios }) => {
      const nombre = usuarios?.nombre ?? `Usuario ${usuario_id}`;
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    const resultado = Object.entries(conteo)
      .map(([usuario, cantidad]) => ({ usuario, cantidad }))
      .sort((a, b) => a.usuario.localeCompare(b.usuario));

    setData(resultado);
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const COLORS = ["#0891b2", "#06b6d4", "#67e8f9", "#a5f3fc"];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="usuario" />
        <YAxis allowDecimals={false} />
        <Tooltip
          formatter={(value) => [`${value} actividades`, "Total"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="cantidad" radius={[12, 12, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
