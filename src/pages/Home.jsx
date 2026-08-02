import PanelControl from "../components/PanelControl";
import GraficoBarra from "../components/GraficoBarra";
import GraficoCircularBomba from "../components/GraficoCircularBomba";
import GraficoCircularPoles from "../components/GraficoCircularPoles";
import GraficoCircularFuentePoder from "../components/GraficoCircularFuentePoder";
import GraficoCircularBaterias from "../components/GraficoCircularBaterias";
import GraficoUsuarios from "../components/GraficoUsuarios";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Dashboard from "../components/ui/DashboardLoader";
import ReporteSemanalPDF from "../components/ReporteSemanalPDF";

import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaHospital,
} from "react-icons/fa";

export default function Home() {
  const [totalMaquinas, setTotalMaquinas] = useState(0);
  const [completadas, setCompletadas] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);

  const reporteRef = useRef(null); // Referencia al canvas

  const obtenerResumen = async () => {
    setLoading(true);

    try {
      const hoy = new Date();

      // Lunes
      const diaSemana = hoy.getDay();
      const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() + diferencia);
      lunes.setHours(0, 0, 0, 0);

      // Domingo
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      domingo.setHours(23, 59, 59, 999);

      const desde = lunes.toISOString();
      const hasta = domingo.toISOString();

      const [maquinas, poles, fuentes, baterias, completadas, pendientes] =
        await Promise.all([
          supabase
            .from("maquinas")
            .select("*", { count: "exact", head: true })
            .gte("creado_en", desde)
            .lte("creado_en", hasta),

          supabase
            .from("poles")
            .select("*", { count: "exact", head: true })
            .gte("creado_en", desde)
            .lte("creado_en", hasta),

          supabase
            .from("fuentespoder")
            .select("*", { count: "exact", head: true })
            .gte("creado_en", desde)
            .lte("creado_en", hasta),

          supabase
            .from("baterias")
            .select("*", { count: "exact", head: true })
            .gte("creado_en", desde)
            .lte("creado_en", hasta),

          // Completadas (Bombas)
          supabase
            .from("maquinas")
            .select("*", { count: "exact", head: true })
            .eq("empaque", true)
            .gte("creado_en", desde)
            .lte("creado_en", hasta),

          // Pendientes (Bombas)
          supabase
            .from("maquinas")
            .select("*", { count: "exact", head: true })
            .eq("empaque", false)
            .gte("creado_en", desde)
            .lte("creado_en", hasta),
        ]);

      const errores = [
        maquinas.error,
        poles.error,
        fuentes.error,
        baterias.error,
        completadas.error,
        pendientes.error,
      ];

      const error = errores.find((e) => e);

      if (error) {
        console.log(error);
        return;
      }

      const total =
        (maquinas.count || 0) +
        (poles.count || 0) +
        (fuentes.count || 0) +
        (baterias.count || 0);

      setTotalMaquinas(total);
      setCompletadas(completadas.count || 0);
      setPendientes(pendientes.count || 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    if (!reporteRef.current) {
      console.error("No se encontró el contenido para generar el PDF.");
      return;
    }

    const canvas = await html2canvas(reporteRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      foreignObjectRendering: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("Reporte-Semanal.pdf");
  };

  useEffect(() => {
    obtenerResumen();
  }, []);

  return (
    <>
      {loading && <Dashboard />}
      <div className="flex min-h-screen bg-slate-100">
        <PanelControl />
        <div className="flex-1">
          <div ref={reporteRef} className="max-w-7xl mx-auto px-5 py-8">
            <div className="mb-8 flex justify-between items-center">
              {/* Título */}
              <div className="flex items-center gap-4">
                <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">
                  <FaHeartbeat className="text-white text-3xl" />
                </div>

                <div>
                  <h1 className="text-4xl font-bold text-slate-800">
                    Dashboard Médico
                  </h1>

                  <p className="text-slate-500 mt-1">
                    Monitoreo y seguimiento de equipos médicos semanales.
                  </p>
                </div>
              </div>

              {/* Botón */}
              <ReporteSemanalPDF
                totalEquipos={totalMaquinas}
                completadas={completadas}
                pendientes={pendientes}
              />
            </div>

            {/* TARJETAS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-500">Total Equipos Médicos</p>

                    <h2 className="text-4xl font-bold text-slate-800 mt-2">
                      {loading ? (
                        <div className="animate-pulse h-10 w-20 bg-slate-200 rounded-lg"></div>
                      ) : (
                        totalMaquinas
                      )}
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
                    <p className="text-slate-500">Completadas</p>

                    <h2 className="text-4xl font-bold text-green-600 mt-2">
                      {loading ? (
                        <div className="animate-pulse h-10 w-20 bg-green-100 rounded-lg"></div>
                      ) : (
                        completadas
                      )}
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
                    <p className="text-slate-500">Pendientes</p>

                    <h2 className="text-4xl font-bold text-red-500 mt-2">
                      {loading ? (
                        <div className="animate-pulse h-10 w-20 bg-red-100 rounded-lg"></div>
                      ) : (
                        pendientes
                      )}
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
                  Total a la Semana
                </h2>

                <GraficoBarra />
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-700 mb-5">
                  Distribución por Usuario
                </h2>

                <GraficoUsuarios />
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-700 mb-5">
                  Distribución por Estados
                </h2>

                <GraficoCircularBomba />
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-700 mb-5">
                  Distribución por Estados
                </h2>

                <GraficoCircularPoles />
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-700 mb-5">
                  Distribución por Estados
                </h2>

                <GraficoCircularFuentePoder />
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-700 mb-5">
                  Distribución por Estados
                </h2>

                <GraficoCircularBaterias />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
