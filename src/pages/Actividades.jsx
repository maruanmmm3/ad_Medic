import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaClipboardList,
  FaSearch,
  FaCalendarAlt,
  FaDatabase,
  FaExclamationCircle,
  FaArrowLeft,
  FaEye,
  FaTimes,
} from "react-icons/fa";

const PAGE_SIZE = 8;

// Relaciones: qué campo (llave foránea) corresponde a qué tabla y qué columna mostrar como nombre
const RELACIONES = {
  categoria_id: { tabla: "categorias", campo: "nombre" },
  usuario_id: { tabla: "usuarios", campo: "nombre" },
};

// Colores por tipo de acción (ajusta las claves a los valores reales que guardes en "actividad")
const ACTIVIDAD_STYLES = {
  crear: "bg-emerald-50 text-emerald-700 border-emerald-200",
  actualizar: "bg-amber-50 text-amber-700 border-amber-200",
  eliminar: "bg-red-50 text-red-700 border-red-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

function getActividadStyle(actividad = "") {
  const key = actividad.toLowerCase();
  if (key.includes("crear") || key.includes("nuevo"))
    return ACTIVIDAD_STYLES.crear;
  if (key.includes("actualiz") || key.includes("edit"))
    return ACTIVIDAD_STYLES.actualizar;
  if (key.includes("elimin") || key.includes("borr"))
    return ACTIVIDAD_STYLES.eliminar;
  return ACTIVIDAD_STYLES.default;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const date = new Date(fecha);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Actividades() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [tablaFiltro, setTablaFiltro] = useState("todas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCargando, setModalCargando] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalDatos, setModalDatos] = useState(null);
  const [modalTabla, setModalTabla] = useState("");
  const [modalNombres, setModalNombres] = useState({});

  useEffect(() => {
    cargarActividades();
  }, []);

  async function cargarActividades() {
    try {
      setLoading(true);
      setError(null);

      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (!usuario?.id) {
        throw new Error("No se encontró una sesión activa.");
      }

      const { data, error: queryError } = await supabase
        .from("historial_actividades")
        .select("tabla, registro_id, actividad, usuario_id, fecha")
        .eq("usuario_id", usuario.id)
        .order("fecha", { ascending: false });

      if (queryError) throw queryError;

      setRegistros(data ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Ocurrió un error al cargar tus actividades.");
    } finally {
      setLoading(false);
    }
  }

  async function verRegistro(tabla, registroId) {
    setModalAbierto(true);
    setModalTabla(tabla);
    setModalCargando(true);
    setModalError(null);
    setModalDatos(null);
    setModalNombres({});

    try {
      if (!tabla || !registroId) {
        throw new Error("No se pudo determinar el registro a consultar.");
      }

      const { data, error: consultaError } = await supabase
        .from(tabla)
        .select("*")
        .eq("id", registroId)
        .maybeSingle();

      if (consultaError) throw consultaError;

      if (!data) {
        setModalError("El registro no existe o fue eliminado.");
        return;
      }

      setModalDatos(data);
      await resolverRelaciones(data);
    } catch (err) {
      console.error(err);
      setModalError("El registro no existe o fue eliminado.");
    } finally {
      setModalCargando(false);
    }
  }

  async function resolverRelaciones(data) {
    const nombres = {};

    await Promise.all(
      Object.keys(RELACIONES).map(async (campoFK) => {
        const valorFK = data[campoFK];
        if (valorFK === null || valorFK === undefined) return;

        const { tabla, campo } = RELACIONES[campoFK];
        try {
          const { data: relacionado, error: relacionError } = await supabase
            .from(tabla)
            .select(campo)
            .eq("id", valorFK)
            .maybeSingle();

          if (!relacionError && relacionado) {
            nombres[campoFK] = relacionado[campo];
          }
        } catch (err) {
          console.error(`No se pudo resolver ${campoFK}:`, err);
        }
      }),
    );

    setModalNombres(nombres);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setModalDatos(null);
    setModalError(null);
    setModalTabla("");
    setModalNombres({});
  }

  const tablasDisponibles = useMemo(() => {
    const unicas = new Set(registros.map((r) => r.tabla).filter(Boolean));
    return ["todas", ...Array.from(unicas)];
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const coincideTabla = tablaFiltro === "todas" || r.tabla === tablaFiltro;
      const texto = `${r.tabla} ${r.registro_id} ${r.actividad}`.toLowerCase();
      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      let coincideFecha = true;
      if (r.fecha && (fechaInicio || fechaFin)) {
        const fechaRegistro = new Date(r.fecha);
        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          coincideFecha = coincideFecha && fechaRegistro >= inicio;
        }
        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          coincideFecha = coincideFecha && fechaRegistro <= fin;
        }
      }

      return coincideTabla && coincideBusqueda && coincideFecha;
    });
  }, [registros, tablaFiltro, busqueda, fechaInicio, fechaFin]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosFiltrados.length / PAGE_SIZE),
  );
  const registrosPagina = registrosFiltrados.slice(
    (pagina - 1) * PAGE_SIZE,
    pagina * PAGE_SIZE,
  );

  const actividadesHoy = registros.filter((r) => {
    if (!r.fecha) return false;
    const hoy = new Date();
    const fechaRegistro = new Date(r.fecha);
    return (
      fechaRegistro.getDate() === hoy.getDate() &&
      fechaRegistro.getMonth() === hoy.getMonth() &&
      fechaRegistro.getFullYear() === hoy.getFullYear()
    );
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0"
          aria-label="Regresar"
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm shrink-0">
          <FaClipboardList className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Mis Actividades
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Historial de acciones realizadas en el sistema.
          </p>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">Total Actividades</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {registros.length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-sky-100 flex items-center justify-center">
            <FaDatabase className="w-5 h-5 text-sky-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">Hoy</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {actividadesHoy}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FaCalendarAlt className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">Tablas Distintas</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {Math.max(0, tablasDisponibles.length - 1)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FaClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            Historial de actividades
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <FaSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por tabla, registro o acción..."
                className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={tablaFiltro}
              onChange={(e) => {
                setTablaFiltro(e.target.value);
                setPagina(1);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {tablasDisponibles.map((t) => (
                <option key={t} value={t}>
                  {t === "todas" ? "Todas las tablas" : t}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPagina(1);
                }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-400 text-sm">a</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPagina(1);
                }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {(fechaInicio || fechaFin) && (
                <button
                  onClick={() => {
                    setFechaInicio("");
                    setFechaFin("");
                    setPagina(1);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-16">
            <span className="text-lg">⏳ Cargando historial</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            <FaExclamationCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && registrosFiltrados.length === 0 && (
          <div className="text-center text-slate-500 py-16">
            No se encontraron actividades para mostrar.
          </div>
        )}

        {!loading && !error && registrosFiltrados.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Tabla</th>
                    <th className="py-2 pr-4 font-medium">Registro</th>
                    <th className="py-2 pr-4 font-medium">Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPagina.map((r, idx) => (
                    <tr
                      key={`${r.registro_id}-${r.fecha}-${idx}`}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {formatFecha(r.fecha)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {r.tabla === "maquinas" ? "bombas" : r.tabla}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => verRegistro(r.tabla, r.registro_id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 text-xs font-medium"
                          title="Ver registro"
                        >
                          <FaEye className="w-3.5 h-3.5" />#{r.registro_id}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${getActividadStyle(
                            r.actividad,
                          )}`}
                        >
                          {r.actividad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-5 text-sm text-slate-500">
              <span>
                Página {pagina} de {totalPaginas} · {registrosFiltrados.length}{" "}
                resultados
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de detalle del registro */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Detalle del registro
                </h3>
                {modalTabla && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tabla:{" "}
                    <span className="font-medium text-slate-700">
                      {modalTabla}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {modalCargando && (
                <div className="text-center text-slate-500 py-8">
                  ⏳ Cargando registro...
                </div>
              )}

              {!modalCargando && modalError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                  <FaExclamationCircle className="w-5 h-5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {!modalCargando && !modalError && modalDatos && (
                <dl className="divide-y divide-slate-100">
                  {Object.entries(modalDatos).map(([campo, valor]) => {
                    const tieneRelacion = Boolean(RELACIONES[campo]);
                    const nombreRelacionado = modalNombres[campo];
                    const valorMostrado = tieneRelacion
                      ? (nombreRelacionado ??
                        (valor === null ? "—" : `#${valor}`))
                      : valor === null || valor === ""
                        ? "—"
                        : typeof valor === "object"
                          ? JSON.stringify(valor)
                          : String(valor);

                    return (
                      <div
                        key={campo}
                        className="grid grid-cols-3 gap-3 py-2.5 text-sm"
                      >
                        <dt className="text-slate-500 font-medium capitalize">
                          {campo.replaceAll("_", " ")}
                        </dt>
                        <dd className="col-span-2 text-slate-800 break-words">
                          {valorMostrado}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
