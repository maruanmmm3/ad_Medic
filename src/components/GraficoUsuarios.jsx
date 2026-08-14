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
  const [cargando, setCargando] = useState(true);

  const obtenerDatos = async () => {
    setCargando(true);

    const hoy = new Date();

    // Obtener el lunes de la semana
    const diaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes...
    const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diferencia);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const { data: historial, error } = await supabase
      .from("historial_actividades")
      .select("usuario_id, usuarios(nombre), fecha")
      .gte("fecha", lunes.toISOString())
      .lte("fecha", domingo.toISOString());

    if (error) {
      console.error("Error al obtener historial:", error);
      setData([]);
      setCargando(false);
      return;
    }

    const conteo = {};

    historial.forEach(({ usuario_id, usuarios }) => {
      const nombre = usuarios?.nombre ?? `Usuario ${usuario_id}`;
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    const resultado = Object.entries(conteo)
      .map(([usuario, cantidad]) => ({
        usuario,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    setData(resultado);
    setCargando(false);
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const COLORS = ["#0891b2", "#06b6d4", "#67e8f9", "#a5f3fc"];

  if (cargando) {
    return (
      <div
        id="grafico-usuarios"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        id="grafico-usuarios"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <p>No hay información de la semana</p>
      </div>
    );
  }

  return (
    <div id="grafico-usuarios">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
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
    </div>
  );
}
