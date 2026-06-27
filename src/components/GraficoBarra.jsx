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
} from "recharts";

export default function Grafico() {
  const [data, setData] = useState([]);

  const obtenerSemanaActual = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 domingo - 6 sábado

    // Lunes de la semana actual
    const lunes = new Date(hoy);
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    lunes.setDate(hoy.getDate() + diff);
    lunes.setHours(0, 0, 0, 0);

    // Viernes
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    viernes.setHours(23, 59, 59, 999);

    return { lunes, viernes };
  };

  const obtenerDatos = async () => {
    const { lunes, viernes } = obtenerSemanaActual();

    const consultas = [
      supabase
        .from("maquinas")
        .select("creado_en")
        .gte("creado_en", lunes.toISOString())
        .lte("creado_en", viernes.toISOString()),

      supabase
        .from("poles")
        .select("creado_en")
        .gte("creado_en", lunes.toISOString())
        .lte("creado_en", viernes.toISOString()),

      supabase
        .from("fuentespoder")
        .select("creado_en")
        .gte("creado_en", lunes.toISOString())
        .lte("creado_en", viernes.toISOString()),

      supabase
        .from("baterias")
        .select("creado_en")
        .gte("creado_en", lunes.toISOString())
        .lte("creado_en", viernes.toISOString()),
    ];

    const resultados = await Promise.all(consultas);

    const conteo = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
    };

    const mapDias = {
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
    };

    resultados.forEach(({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      data.forEach((item) => {
        const fecha = new Date(item.creado_en);
        const dia = mapDias[fecha.getDay()];

        if (dia) {
          conteo[dia]++;
        }
      });
    });

    setData([
      { dia: "Lunes", cantidad: conteo.Lunes },
      { dia: "Martes", cantidad: conteo.Martes },
      { dia: "Miércoles", cantidad: conteo.Miércoles },
      { dia: "Jueves", cantidad: conteo.Jueves },
      { dia: "Viernes", cantidad: conteo.Viernes },
    ]);
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="cantidad" radius={[12, 12, 0, 0]} fill="#0891b2" />
      </BarChart>
    </ResponsiveContainer>
  );
}
