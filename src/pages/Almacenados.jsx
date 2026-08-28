import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBoxOpen,
  FaArrowLeft,
  FaPlus,
  FaFilter,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";

export default function Almacenados() {
  const [almacenados, setAlmacenados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);

  // FILTROS
  const [filtroResponsable, setFiltroResponsable] = useState("");
  const [filtroSerie, setFiltroSerie] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const obtenerDatos = async (pagina = 1) => {
    setLoading(true);

    const from = (pagina - 1) * pageSize;
    const to = from + pageSize - 1;

    // El join con "categorias" asume que existe una foreign key
    // almacenados.categoria_id -> categorias.id en Supabase.
    // Si el nombre de la tabla/columna de categorías es distinto,
    // ajusta "categorias(nombre)" según corresponda.
    let query = supabase
      .from("almacenados")
      .select("*, categorias(nombre)", { count: "exact" });

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
      // Filtra todo el rango del día seleccionado
      const inicio = `${filtroFecha}T00:00:00`;
      const fin = `${filtroFecha}T23:59:59`;
      query = query.gte("fecha", inicio).lte("fecha", fin);
    }

    const { data, error, count } = await query
      .order("fecha", { ascending: false })
      .range(from, to);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setAlmacenados(data);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    obtenerDatos(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroResponsable, filtroSerie, filtroLote, filtroFecha]);

  // Si cambia un filtro, siempre vuelve a la página 1
  useEffect(() => {
    setPage(1);
  }, [filtroResponsable, filtroSerie, filtroLote, filtroFecha]);

  useEffect(() => {
    if (location.state?.mensaje) {
      Swal.fire({
        title: "📦 Éxito",
        text: location.state.mensaje,
        icon: "success",
        confirmButtonColor: "#0891b2",
        background: "#f8fafc",
        timer: 2500,
        showConfirmButton: false,
      });

      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const totalPages = Math.ceil(total / pageSize);

  const limpiarFiltros = () => {
    setFiltroResponsable("");
    setFiltroSerie("");
    setFiltroLote("");
    setFiltroFecha("");
  };

  const hayFiltrosActivos =
    filtroResponsable || filtroSerie || filtroLote || filtroFecha;

  const cantidadFiltrosActivos = [
    filtroResponsable,
    filtroSerie,
    filtroLote,
    filtroFecha,
  ].filter(Boolean).length;

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const EstadoBadge = ({ valor }) => {
    const esOperativa = (valor || "").toLowerCase() === "operativa";

    return (
      <div
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
          esOperativa
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }`}
      >
        {valor || "Sin estado"}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* TITULO */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-600 p-3 md:p-4 rounded-2xl shadow-lg shrink-0">
              <FaBoxOpen className="text-white text-2xl md:text-3xl" />
            </div>

            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-800">
                Gestión de Almacenados
              </h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">
                Control de artículos almacenados y su categoría.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/home")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-md transition text-sm md:text-base"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">Regresar</span>
            </button>

            <button
              onClick={() => navigate("/agregar-almacenados")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md transition text-sm md:text-base"
            >
              <FaPlus />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 md:p-6 mb-6">
        {/* Botón toggle solo visible en móvil */}
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full flex items-center justify-between md:hidden"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="text-cyan-600" />
            <span className="font-bold text-slate-800">Filtros</span>
            {cantidadFiltrosActivos > 0 && (
              <span className="bg-cyan-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cantidadFiltrosActivos}
              </span>
            )}
          </div>
          <FaChevronRight
            className={`text-slate-400 transition-transform ${
              mostrarFiltros ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Header visible solo en desktop */}
        <div className="hidden md:flex items-center gap-2 mb-4">
          <FaFilter className="text-cyan-600" />
          <h2 className="text-lg font-bold text-slate-800">Filtros</h2>

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="ml-auto flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition"
            >
              <FaTimes />
              Limpiar filtros
            </button>
          )}
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${
            mostrarFiltros ? "mt-4" : "hidden"
          } md:grid md:mt-0`}
        >
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Responsable
            </label>
            <input
              type="text"
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              placeholder="Buscar por responsable..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Serie
            </label>
            <input
              type="text"
              value={filtroSerie}
              onChange={(e) => setFiltroSerie(e.target.value)}
              placeholder="Buscar por serie..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Lote
            </label>
            <input
              type="text"
              value={filtroLote}
              onChange={(e) => setFiltroLote(e.target.value)}
              placeholder="Buscar por lote..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Botón limpiar filtros, solo visible en móvil dentro del panel expandido */}
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="md:hidden flex items-center justify-center gap-2 text-sm text-red-600 border-2 border-red-200 rounded-xl px-4 py-3"
            >
              <FaTimes />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 text-center text-slate-500">
          ⏳ Cargando almacenados...
        </div>
      ) : almacenados.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 text-center text-slate-500">
          No se encontraron resultados con los filtros aplicados.
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL: tarjetas */}
          <div className="md:hidden space-y-4">
            {almacenados.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/editar-almacenado/${item.id}`)}
                className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-slate-800 text-lg leading-snug">
                    {item.nombre || "Sin nombre"}
                  </h3>
                  <EstadoBadge valor={item.estado} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Responsable
                    </span>
                    <span className="text-slate-700">
                      {item.nombre_responsable || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Categoría
                    </span>
                    <span className="text-slate-700">
                      {item.categorias?.nombre || "Sin categoría"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Serie
                    </span>
                    <span className="text-slate-700">{item.serie || "-"}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Lote
                    </span>
                    <span className="text-slate-700">{item.lote || "-"}</span>
                  </div>
                </div>

                {item.nota && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Nota
                    </span>
                    <span className="text-slate-600 text-sm">{item.nota}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  {formatearFecha(item.fecha)}
                </div>
              </div>
            ))}
          </div>

          {/* VISTA DESKTOP: tabla */}
          <div className="hidden md:block bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-cyan-700 text-white text-sm uppercase">
                    <th className="px-6 py-5 text-left">Nombre</th>
                    <th className="px-6 py-5 text-left">Responsable</th>
                    <th className="px-6 py-5 text-left">Serie</th>
                    <th className="px-6 py-5 text-left">Lote</th>
                    <th className="px-6 py-5 text-left">Categoría</th>
                    <th className="px-4 py-5 text-center">Estado</th>
                    <th className="px-6 py-5 text-left">Nota</th>
                    <th className="px-4 py-5 text-left">Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {almacenados.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/editar-almacenado/${item.id}`)}
                      className={`border-b hover:bg-cyan-50 transition cursor-pointer
                      ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <td className="px-6 py-5 font-bold">
                        {item.nombre || "-"}
                      </td>
                      <td className="px-6 py-5">
                        {item.nombre_responsable || "-"}
                      </td>
                      <td className="px-6 py-5">{item.serie || "-"}</td>
                      <td className="px-6 py-5">{item.lote || "-"}</td>
                      <td className="px-6 py-5">
                        {item.categorias?.nombre || "Sin categoría"}
                      </td>
                      <td className="px-3 py-5 text-center">
                        <div className="flex justify-center">
                          <EstadoBadge valor={item.estado} />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-600">
                        {item.nota || "-"}
                      </td>
                      <td className="px-4 py-5 text-slate-500 text-sm">
                        {formatearFecha(item.fecha)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINACIÓN */}
          <div className="flex justify-center items-center gap-2 p-4 mt-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 shadow-sm text-sm md:text-base"
            >
              Anterior
            </button>

            <span className="px-2 text-sm md:text-base text-slate-600 whitespace-nowrap">
              {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 shadow-sm text-sm md:text-base"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
