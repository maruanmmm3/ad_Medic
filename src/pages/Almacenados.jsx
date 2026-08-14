import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBoxOpen, FaArrowLeft, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

export default function Almacenados() {
  const [almacenados, setAlmacenados] = useState([]);
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

    // El join con "categorias" asume que existe una foreign key
    // almacenados.categoria_id -> categorias.id en Supabase.
    // Si el nombre de la tabla/columna de categorías es distinto,
    // ajusta "categorias(nombre)" según corresponda.
    const { data, error, count } = await supabase
      .from("almacenados")
      .select("*, categorias(nombre)", { count: "exact" })
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
  }, [page]);

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
      <div className="flex justify-center">
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            esOperativa
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {valor || "Sin estado"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* TITULO */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">
              <FaBoxOpen className="text-white text-3xl" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Gestión de Almacenados
              </h1>
              <p className="text-slate-500 mt-1">
                Control de artículos almacenados y su categoría.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-md transition"
            >
              <FaArrowLeft />
              Regresar
            </button>

            <button
              onClick={() => navigate("/agregar-almacenados")}
              className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md transition"
            >
              <FaPlus />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* TARJETA */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            ⏳ Cargando almacenados...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-cyan-700 text-white text-sm uppercase">
                    <th className="px-6 py-5 text-left">Nombre</th>
                    <th className="px-6 py-5 text-left">Serie / Lote</th>
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
                      <td className="px-6 py-5 font-bold">{item.nombre}</td>
                      <td className="px-6 py-5">{item.serie_lote || "-"}</td>
                      <td className="px-6 py-5">
                        {item.categorias?.nombre || "Sin categoría"}
                      </td>
                      <td className="px-3 py-5 text-center">
                        <EstadoBadge valor={item.estado} />
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
