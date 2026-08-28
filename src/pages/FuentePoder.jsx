import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaPlus,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import Swal from "sweetalert2";

export default function FuentePoder() {
  const [fuentes, setFuentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);

  // Filtros
  const [filtroResponsable, setFiltroResponsable] = useState("");
  const [filtroSerie, setFiltroSerie] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const obtenerDatos = async (pagina = 1) => {
    setLoading(true);

    const from = (pagina - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("fuentespoder")
      .select("*, categorias(nombre)", { count: "exact" })
      .order("creado_en", { ascending: false });

    if (filtroResponsable.trim()) {
      query = query.ilike(
        "nombre_responsable",
        `%${filtroResponsable.trim()}%`,
      );
    }

    if (filtroSerie.trim()) {
      query = query.ilike("serie", `%${filtroSerie.trim()}%`);
    }

    if (filtroLote.trim()) {
      query = query.ilike("lote", `%${filtroLote.trim()}%`);
    }

    if (filtroFecha) {
      const inicio = `${filtroFecha}T00:00:00`;
      const fin = `${filtroFecha}T23:59:59`;
      query = query.gte("fecha", inicio).lte("fecha", fin);
    }

    const { data, error, count } = await query.range(from, to);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroResponsable, filtroSerie, filtroLote, filtroFecha]);

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

  const hayFiltros =
    filtroResponsable.trim() ||
    filtroSerie.trim() ||
    filtroLote.trim() ||
    filtroFecha;

  const limpiarFiltros = () => {
    setFiltroResponsable("");
    setFiltroSerie("");
    setFiltroLote("");
    setFiltroFecha("");
    setPage(1);
  };

  const handleFiltro = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "--";
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const Estado = ({ valor }) => {
    return valor ? (
      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
        <FaCheckCircle />
        Completado
      </div>
    ) : (
      <div className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
        <FaTimesCircle />
        Pendiente
      </div>
    );
  };

  const estados = [
    { label: "Recolección", key: "recoleccion" },
    { label: "Reparación", key: "reparacion" },
    { label: "Limpieza", key: "limpieza" },
    { label: "Etiqueta", key: "etiqueta" },
    { label: "Empaquetado", key: "empaquetado" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-8">
      {/* HEADER */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 p-3 sm:p-4 rounded-2xl shadow-lg shrink-0">
            <FaHeartbeat className="text-white text-2xl sm:text-3xl" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">
              Gestión de Fuentes de Poder
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Seguimiento del proceso de mantenimiento.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/home")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-md transition text-sm sm:text-base"
          >
            <FaArrowLeft />
            Regresar
          </button>

          <button
            onClick={() => navigate("/agregar-fuentespoder")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md transition text-sm sm:text-base"
          >
            <FaPlus />
            Agregar
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaSearch className="text-cyan-600" />
          <h2 className="font-semibold text-slate-700 text-sm sm:text-base">
            Filtrar resultados
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={filtroResponsable}
            onChange={handleFiltro(setFiltroResponsable)}
            placeholder="Buscar por responsable"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition"
          />

          <input
            type="text"
            value={filtroSerie}
            onChange={handleFiltro(setFiltroSerie)}
            placeholder="Buscar por serie"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition"
          />

          <input
            type="text"
            value={filtroLote}
            onChange={handleFiltro(setFiltroLote)}
            placeholder="Buscar por lote"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition"
          />

          <input
            type="date"
            value={filtroFecha}
            onChange={handleFiltro(setFiltroFecha)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition"
          />
        </div>

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition"
          >
            <FaTimes />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-10 text-center text-slate-500">⏳ Cargando...</div>
        ) : fuentes.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No se encontraron fuentes de poder con esos filtros.
          </div>
        ) : (
          <>
            {/* VISTA TABLA - md en adelante */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-cyan-700 text-white text-sm uppercase">
                    <th className="px-6 py-5 text-left">Nombre</th>
                    <th className="px-6 py-5 text-left">Responsable</th>
                    <th className="px-6 py-5 text-left">Serie</th>
                    <th className="px-6 py-5 text-left">Lote</th>
                    <th className="px-6 py-5 text-left">Cable</th>
                    <th className="px-6 py-5 text-left">Categoría</th>
                    <th className="px-6 py-5 text-left">Fecha</th>
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
                      <td className="px-6 py-5">
                        {f.nombre_responsable || "--"}
                      </td>
                      <td className="px-6 py-5">{f.serie}</td>
                      <td className="px-6 py-5">{f.lote}</td>
                      <td className="px-6 py-5">{f.categoria_cable || "--"}</td>
                      <td className="px-6 py-5">
                        {f.categorias?.nombre || "--"}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {formatearFecha(f.fecha)}
                      </td>

                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <Estado valor={f.recoleccion} />
                        </div>
                      </td>

                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <Estado valor={f.reparacion} />
                        </div>
                      </td>

                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <Estado valor={f.limpieza} />
                        </div>
                      </td>

                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <Estado valor={f.etiqueta} />
                        </div>
                      </td>

                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <Estado valor={f.empaquetado} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISTA TARJETAS - celular */}
            <div className="md:hidden divide-y divide-slate-100">
              {fuentes.map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/editar-fuentespoder/${f.id}`)}
                  className="p-4 active:bg-cyan-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 text-base">
                      {f.nombre}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {formatearFecha(f.fecha)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-600">
                    <p>
                      <span className="text-slate-400">Responsable:</span>{" "}
                      {f.nombre_responsable || "--"}
                    </p>
                    <p>
                      <span className="text-slate-400">Serie:</span>{" "}
                      {f.serie || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Lote:</span>{" "}
                      {f.lote || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Cable:</span>{" "}
                      {f.categoria_cable || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Categoría:</span>{" "}
                      {f.categorias?.nombre || "-"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {estados.map((e) => (
                      <div key={e.key} className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">
                          {e.label}:
                        </span>
                        <Estado valor={f[e.key]} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINACIÓN */}
            <div className="flex justify-center items-center gap-2 p-4 flex-wrap">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50 text-sm"
              >
                Anterior
              </button>

              <span className="px-2 py-2 text-sm text-slate-600">
                Página {page} de {totalPages || 1}
              </span>

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50 text-sm"
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
