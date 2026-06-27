import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaPlus,
} from "react-icons/fa";
import Swal from "sweetalert2";

export default function FuentePoder() {
  const [fuentes, setFuentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const obtenerDatos = async (pagina = 1) => {
    setLoading(true);

    const from = (pagina - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("fuentespoder")
      .select("*", { count: "exact" })
      .order("creado_en", { ascending: false })
      .range(from, to);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setFuentes(data);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    obtenerDatos(page);
  }, [page]);

  useEffect(() => {
    if (location.state?.mensaje) {
      Swal.fire({
        title: "⚡ Éxito",
        text: location.state.mensaje,
        icon: "success",
        confirmButtonColor: "#0891b2",
        timer: 2500,
        showConfirmButton: false,
      });

      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const totalPages = Math.ceil(total / pageSize);

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
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">
            <FaHeartbeat className="text-white text-3xl" />
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Gestión de Fuentes de Poder
            </h1>
            <p className="text-slate-500 mt-1">
              Seguimiento del proceso de mantenimiento.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 px-5 py-3 bg-slate-700 text-white rounded-xl"
          >
            <FaArrowLeft />
            Regresar
          </button>

          <button
            onClick={() => navigate("/agregar-fuentespoder")}
            className="flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white rounded-xl"
          >
            <FaPlus />
            Agregar
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">⏳ Cargando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-cyan-700 text-white text-sm uppercase">
                    <th className="px-6 py-5 text-left">Nombre</th>
                    <th className="px-6 py-5 text-left">Serie / Lote</th>
                    <th className="px-4 py-5 text-center">Recolección</th>
                    <th className="px-4 py-5 text-center">Reparación</th>
                    <th className="px-4 py-5 text-center">Limpieza</th>
                    <th className="px-4 py-5 text-center">Etiqueta</th>
                    <th className="px-4 py-5 text-center">Empaquetado</th>
                  </tr>
                </thead>

                <tbody>
                  {fuentes.map((f, index) => (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/editar-fuentespoder/${f.id}`)}
                      className={`border-b hover:bg-cyan-50 cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-5 font-bold">{f.nombre}</td>
                      <td className="px-6 py-5">{f.serie_lote}</td>

                      <td className="px-3 py-5 text-center">
                        <Estado valor={f.recoleccion} />
                      </td>

                      <td className="px-3 py-5 text-center">
                        <Estado valor={f.reparacion} />
                      </td>

                      <td className="px-3 py-5 text-center">
                        <Estado valor={f.limpieza} />
                      </td>

                      <td className="px-3 py-5 text-center">
                        <Estado valor={f.etiqueta} />
                      </td>

                      <td className="px-3 py-5 text-center">
                        <Estado valor={f.empaquetado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            <div className="flex justify-center gap-2 p-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="px-4 py-2">
                Página {page} de {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
