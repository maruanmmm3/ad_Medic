import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaBarcode,
} from "react-icons/fa";

export default function Maquinas() {

  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {

    const obtenerDatos = async () => {

      const { data, error } = await supabase
        .from("maquinas")
        .select("*");

      if (error) {

        console.log(error);

        return;

      }

      setMaquinas(data);

    };

    obtenerDatos();

  }, []);

  const Estado = ({ valor }) => {

    return valor ? (

      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
          <FaCheckCircle />
          Completado
        </div>
      </div>

    ) : (

      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
          <FaTimesCircle />
          Pendiente
        </div>
      </div>

    );

  };

  return (

    <div className="min-h-screen bg-slate-100 p-4 md:p-8">

      {/* TITULO */}

      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">

            <FaHeartbeat className="text-white text-3xl" />

          </div>

          <div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">

              Gestión de Máquinas Médicas

            </h1>

            <p className="text-slate-500 mt-1">

              Seguimiento del proceso de mantenimiento y preparación.

            </p>

          </div>

        </div>

      </div>

      {/* TARJETA */}

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>

              <tr className="bg-cyan-700 text-white text-sm uppercase">

                <th className="px-6 py-5 text-left">

                  Máquina

                </th>

                <th className="px-6 py-5 text-left">

                  Serie / Lote

                </th>

                <th className="px-4 py-5 text-center">

                  Recolección

                </th>

                <th className="px-4 py-5 text-center">

                  Limpieza

                </th>

                <th className="px-4 py-5 text-center">

                  Prueba CAN

                </th>

                <th className="px-4 py-5 text-center">

                  Reparación

                </th>

                <th className="px-4 py-5 text-center">

                  Actualización

                </th>

                <th className="px-4 py-5 text-center">

                  TSC

                </th>

                <th className="px-4 py-5 text-center">

                  Empaque

                </th>

              </tr>

            </thead>

            <tbody>

              {

                maquinas.map((m, index) => (

                  <tr
                    key={m.id}
                    className={`
                    border-b border-slate-100
                    hover:bg-cyan-50
                    transition
                    ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  `}
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="bg-cyan-100 p-3 rounded-xl">

                          <FaHeartbeat className="text-cyan-700 text-xl" />

                        </div>

                        <div>

                          <p className="font-bold text-slate-800">

                            {m.nombre}

                          </p>

                          <p className="text-sm text-slate-500">

                            Equipo médico

                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2 text-slate-700">

                        <FaBarcode className="text-cyan-600" />

                        {m.serie_lote}

                      </div>

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.recoleccion} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.limpieza} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.prueba_can} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.reparacion} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.actualizacion} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.tsc} />

                    </td>

                    <td className="px-3 py-5 text-center">

                      <Estado valor={m.empaque} />

                    </td>

                  </tr>

                ))

              }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}