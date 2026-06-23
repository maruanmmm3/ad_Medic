import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Grafico() {

const [data, setData] = useState([]);

  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
  ];

 const obtenerDatos = async () => {

  // Fecha actual
  const hoy = new Date();

  // Obtener lunes de esta semana
  const lunes = new Date(hoy);

  const diaSemana = hoy.getDay(); // Domingo=0, Lunes=1

  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

  lunes.setDate(hoy.getDate() + diferencia);

  lunes.setHours(0, 0, 0, 0);

  // Viernes de esta semana

  const viernes = new Date(lunes);

  viernes.setDate(lunes.getDate() + 4);

  viernes.setHours(23, 59, 59, 999);

  const { data: registros, error } = await supabase

    .from("maquinas")

    .select("creado_en")

    .gte("creado_en", lunes.toISOString())

    .lte("creado_en", viernes.toISOString());

  if (error) {

    console.log(error);

    return;

  }

  const conteo = {

    Lunes: 0,

    Martes: 0,

    Miércoles: 0,

    Jueves: 0,

    Viernes: 0,

  };

  registros.forEach((item) => {

    const fecha = new Date(item.creado_en);

    const mapDias = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
};
const dia = mapDias[fecha.getDay()];
if (dia && conteo[dia] !== undefined) {
  conteo[dia]++;
}

    if (conteo[dia] !== undefined) {

      conteo[dia]++;

    }

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

        <Bar
          dataKey="cantidad"
          radius={[12, 12, 0, 0]}
          fill="#0891b2"
        />

      </BarChart>

    </ResponsiveContainer>

  );

}