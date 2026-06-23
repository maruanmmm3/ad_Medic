import Navbar from "../components/Navbar";
import GraficoBarra from "../components/GraficoBarra";
import GraficoCircular from "../components/GraficoCircular";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaHospital
} from "react-icons/fa";

export default function Home() {

const [totalMaquinas, setTotalMaquinas] = useState(0);
const [completadas, setCompletadas] = useState(0);
const [pendientes, setPendientes] = useState(0);
const [loading, setLoading] = useState(true);

const obtenerResumen = async () => {

  setLoading(true);

  try {


    const [

      { count: total, error: errorTotal },

      { count: totalCompletadas, error: errorCompletadas },

      { count: totalPendientes, error: errorPendientes }

    ] = await Promise.all([

      supabase
        .from("maquinas")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("maquinas")
        .select("*", { count: "exact", head: true })
        .eq("empaque", true),

      supabase
        .from("maquinas")
        .select("*", { count: "exact", head: true })
        .eq("empaque", false)

    ]);

    if (errorTotal || errorCompletadas || errorPendientes) {

      console.log(
        errorTotal ||
        errorCompletadas ||
        errorPendientes
      );

      return;
    }

    setTotalMaquinas(total || 0);

    setCompletadas(totalCompletadas || 0);

    setPendientes(totalPendientes || 0);

  }

  catch (error) {

    console.log(error);

  }

  finally {

    setLoading(false);

  }

};

useEffect(() => {

  obtenerResumen();

}, []);

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* TITULO */}

        <div className="mb-8">

          <div className="flex items-center gap-4">

            <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">

              <FaHeartbeat className="text-white text-3xl" />

            </div>

            <div>

              <h1 className="text-4xl font-bold text-slate-800">
                Dashboard Médico
              </h1>

              <p className="text-slate-500 mt-1">
                Monitoreo y seguimiento de equipos médicos.
              </p>

            </div>

          </div>

        </div>


        {/* TARJETAS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-slate-500">
                  Total Máquinas
                </p>

                <h2 className="text-4xl font-bold text-slate-800 mt-2">
                  {

                  loading ?

                <div className="animate-pulse h-10 w-20 bg-slate-200 rounded-lg"></div>
                :
                totalMaquinas
                }
                </h2>

              </div>

              <div className="bg-cyan-100 p-4 rounded-2xl">

                <FaHospital className="text-cyan-700 text-3xl" />

              </div>

            </div>

          </div>


          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-slate-500">
                  Completadas
                </p>

                <h2 className="text-4xl font-bold text-green-600 mt-2">
                  {
                loading ?

                <div className="animate-pulse h-10 w-20 bg-green-100 rounded-lg"></div>
                :
                completadas
                }
                </h2>

              </div>

              <div className="bg-green-100 p-4 rounded-2xl">

                <FaCheckCircle className="text-green-600 text-3xl" />

              </div>

            </div>

          </div>


          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-slate-500">
                  Pendientes
                </p>

                <h2 className="text-4xl font-bold text-red-500 mt-2">
                  {
                loading ?

                <div className="animate-pulse h-10 w-20 bg-red-100 rounded-lg"></div>
                :
                pendientes
                }
                </h2>

              </div>

              <div className="bg-red-100 p-4 rounded-2xl">

                <FaTimesCircle className="text-red-500 text-3xl" />

              </div>

            </div>

          </div>

        </div>


        {/* GRAFICOS */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-white rounded-3xl shadow-lg p-6">

            <h2 className="text-xl font-bold text-slate-700 mb-5">

              Estado de Máquinas

            </h2>

            <GraficoBarra />

          </div>


          <div className="bg-white rounded-3xl shadow-lg p-6">

            <h2 className="text-xl font-bold text-slate-700 mb-5">

              Distribución

            </h2>

            <GraficoCircular />

          </div>

        </div>

      </div>

    </div>

  );

}