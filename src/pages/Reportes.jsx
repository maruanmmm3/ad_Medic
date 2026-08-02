import { useEffect, useMemo, useState } from "react";
import {
  FiFileText,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiUsers,
  FiArrowLeft,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
// Ajusta esta ruta a donde tengas tu cliente de supabase
import { supabase } from "../lib/supabase";

// Configuración de cada tabla: nombre de tabla real, etiqueta a mostrar
// y los campos booleanos (con su etiqueta legible) que definen el flujo
// de proceso de ese tipo de equipo, en orden.
const CONFIGS = {
  maquinas: {
    label: "Máquina",
    fields: [
      { key: "recoleccion", label: "Recolección" },
      { key: "limpieza", label: "Limpieza" },
      { key: "prueba_can", label: "Prueba CAN" },
      { key: "reparacion", label: "Reparación" },
      { key: "actualizacion", label: "Actualización" },
      { key: "tsc", label: "TSC" },
      { key: "empaque", label: "Empaque" },
    ],
  },
  poles: {
    label: "Poles",
    fields: [
      { key: "recoleccion", label: "Recolección" },
      { key: "recuperacion", label: "Recuperación" },
      { key: "base", label: "Base" },
      { key: "pintura", label: "Pintura" },
      { key: "limpieza", label: "Limpieza" },
      { key: "empaquetado", label: "Empaquetado" },
    ],
  },
  fuentespoder: {
    label: "Fuente de Poder",
    fields: [
      { key: "recoleccion", label: "Recolección" },
      { key: "reparacion", label: "Reparación" },
      { key: "limpieza", label: "Limpieza" },
      { key: "etiqueta", label: "Etiquetado" },
      { key: "empaquetado", label: "Empaquetado" },
    ],
  },
  baterias: {
    label: "Batería",
    fields: [
      { key: "mantenimiento", label: "Mantenimiento" },
      { key: "prueba", label: "Prueba" },
    ],
  },
};

export default function Reportes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  // Filtros "aplicados" — solo se actualizan al presionar Buscar,
  // para no refiltrar en cada tecla/click de los selects.
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    fechaInicio: "",
    fechaFin: "",
    usuario: "Todos",
    estado: "Todos",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError(null);

    try {
      const tablas = Object.keys(CONFIGS);

      const resultados = await Promise.all(
        tablas.map((tabla) =>
          supabase
            .from(tabla)
            .select("*, usuarios(nombre)")
            .order("creado_en", { ascending: false }),
        ),
      );

      const unificado = [];

      resultados.forEach((res, i) => {
        const tabla = tablas[i];
        const config = CONFIGS[tabla];

        if (res.error) {
          console.error(`Error cargando ${tabla}:`, res.error);
          return;
        }

        (res.data ?? []).forEach((registro) => {
          const completado = config.fields.every(
            (campo) => registro[campo.key] === true,
          );

          // Si está pendiente, buscamos el primer paso del flujo que
          // todavía no se marcó, para saber en qué etapa se quedó.
          const primerPendiente = config.fields.find(
            (campo) => registro[campo.key] !== true,
          );

          unificado.push({
            id: `${tabla}-${registro.id}`,
            tipo: config.label,
            nombre: registro.nombre,
            serie_lote: registro.serie_lote ?? "—",
            usuario_id: registro.usuario_id,
            usuario: registro.usuarios?.nombre ?? "Sin asignar",
            fecha: registro.creado_en,
            completado,
            etapaPendiente: completado ? null : (primerPendiente?.label ?? "—"),
          });
        });
      });

      // Más reciente primero
      unificado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setRows(unificado);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Lista de usuarios únicos para el <select>
  const usuariosDisponibles = useMemo(() => {
    const nombres = new Set(rows.map((r) => r.usuario).filter(Boolean));
    return ["Todos", ...Array.from(nombres).sort()];
  }, [rows]);

  const filasFiltradas = useMemo(() => {
    return rows.filter((r) => {
      if (filtrosAplicados.fechaInicio) {
        const fecha = new Date(r.fecha);
        const inicio = new Date(filtrosAplicados.fechaInicio);
        if (fecha < inicio) return false;
      }

      if (filtrosAplicados.fechaFin) {
        const fecha = new Date(r.fecha);
        const fin = new Date(filtrosAplicados.fechaFin);
        // incluir todo el día de "fin"
        fin.setHours(23, 59, 59, 999);
        if (fecha > fin) return false;
      }

      if (
        filtrosAplicados.usuario !== "Todos" &&
        r.usuario !== filtrosAplicados.usuario
      ) {
        return false;
      }

      if (filtrosAplicados.estado !== "Todos") {
        const esCompletado = filtrosAplicados.estado === "Completado";
        if (r.completado !== esCompletado) return false;
      }

      return true;
    });
  }, [rows, filtrosAplicados]);

  const stats = useMemo(() => {
    const total = filasFiltradas.length;
    const completados = filasFiltradas.filter((r) => r.completado).length;
    const pendientes = total - completados;
    const usuariosUnicos = new Set(
      filasFiltradas.map((r) => r.usuario_id).filter(Boolean),
    ).size;

    return { total, completados, pendientes, usuariosUnicos };
  }, [filasFiltradas]);

  function handleBuscar() {
    setFiltrosAplicados({
      fechaInicio,
      fechaFin,
      usuario: usuarioFiltro,
      estado: estadoFiltro,
    });
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return "—";
    const d = new Date(fechaISO);
    return d.toLocaleDateString("es-PE");
  }

  function handleExportarExcel() {
    const datos = filasFiltradas.map((r) => ({
      Fecha: formatearFecha(r.fecha),
      Tipo: r.tipo,
      Nombre: r.nombre,
      "Serie/Lote": r.serie_lote,
      Usuario: r.usuario,
      Estado: r.completado ? "Completado" : "Pendiente",
      Etapa: r.completado ? "—" : r.etapaPendiente,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);

    // Ancho de columnas aproximado para que se lea bien al abrir el archivo
    hoja["!cols"] = [
      { wch: 12 }, // Fecha
      { wch: 16 }, // Tipo
      { wch: 22 }, // Nombre
      { wch: 16 }, // Serie/Lote
      { wch: 20 }, // Usuario
      { wch: 14 }, // Estado
      { wch: 18 }, // Etapa
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reportes");

    const fechaArchivo = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `reportes_${fechaArchivo}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* BOTON REGRESAR */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
      >
        <FiArrowLeft />
        Regresar
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
          <div className="bg-cyan-600 text-white p-5 rounded-2xl shadow-lg">
            <FiFileText size={30} />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-slate-800">Reportes</h1>

            <p className="text-slate-500">
              Consulta y genera reportes del sistema.
            </p>
          </div>
        </div>

        {/* PDF pendiente de implementar — de momento deshabilitado */}
        <button
          disabled
          title="Próximamente"
          className="bg-red-300 cursor-not-allowed transition text-white px-7 py-4 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
        >
          <FiDownload />
          Generar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-700 mb-5">Filtros</h2>

        <div className="grid grid-cols-5 gap-5">
          <div>
            <label className="text-sm text-slate-500">Fecha Inicio</label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">Fecha Fin</label>

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">Usuario</label>

            <select
              value={usuarioFiltro}
              onChange={(e) => setUsuarioFiltro(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3"
            >
              {usuariosDisponibles.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-500">Estado</label>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3"
            >
              <option>Todos</option>
              <option>Completado</option>
              <option>Pendiente</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleBuscar}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3 flex justify-center gap-2 items-center"
            >
              <FiSearch />
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card
          titulo="Total Equipos"
          valor={stats.total}
          icon={<FiCalendar />}
        />
        <Card
          titulo="Completados"
          valor={stats.completados}
          icon={<FiFileText />}
        />
        <Card titulo="Pendientes" valor={stats.pendientes} icon={<FiUsers />} />
        <Card
          titulo="Usuarios"
          valor={stats.usuariosUnicos}
          icon={<FiUsers />}
        />
      </div>

      {/* GRAFICOS (pendiente de implementar) */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">
          <h2 className="text-2xl font-bold text-slate-700 mb-5">
            Actividades por Semana
          </h2>

          <div className="h-full flex items-center justify-center text-slate-400">
            Aquí irá el BarChart
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 h-[420px]">
          <h2 className="text-2xl font-bold text-slate-700 mb-5">
            Distribución por Usuario
          </h2>

          <div className="h-full flex items-center justify-center text-slate-400">
            Aquí irá el PieChart
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-700">
            Historial de Reportes
          </h2>

          <button
            onClick={handleExportarExcel}
            disabled={loading || filasFiltradas.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow"
          >
            <FiDownload />
            Descargar Excel
          </button>
        </div>

        {loading && (
          <p className="text-slate-400 py-8 text-center">Cargando datos…</p>
        )}

        {error && <p className="text-red-500 py-4 text-center">{error}</p>}

        {!loading && !error && (
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-4">Fecha</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Nombre</th>
                <th className="text-left p-4">Usuario</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Etapa</th>
              </tr>
            </thead>

            <tbody>
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No hay resultados para los filtros seleccionados.
                  </td>
                </tr>
              )}

              {filasFiltradas.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-4">{formatearFecha(r.fecha)}</td>
                  <td className="p-4">{r.tipo}</td>
                  <td className="p-4">{r.nombre}</td>
                  <td className="p-4">{r.usuario}</td>
                  <td className="p-4">
                    {r.completado ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        Completado
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">
                    {r.completado ? "—" : r.etapaPendiente}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ titulo, valor, icon }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 flex justify-between items-center">
      <div>
        <p className="text-slate-500">{titulo}</p>
        <h2 className="text-4xl font-bold text-slate-800 mt-3">{valor}</h2>
      </div>

      <div className="bg-cyan-100 text-cyan-700 p-5 rounded-2xl text-3xl">
        {icon}
      </div>
    </div>
  );
}
