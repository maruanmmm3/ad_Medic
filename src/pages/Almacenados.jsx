import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBoxOpen,
  FaArrowLeft,
  FaPlus,
  FaFilter,
  FaTimes,
  FaChevronRight,
  FaFileExcel,
  FaSpinner,
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Utilidades para limpiar los datos que vienen del Excel de inventario.
// El archivo original tiene columnas: CTDA. | SN | Lote | Referencia |
// Año Fbcn | Ubicaciòn, y los datos vienen con formatos inconsistentes
// (fechas como texto, como Date, o solo el año; referencias como número
// o como texto con espacios), así que se normalizan antes de insertarlos.
// ---------------------------------------------------------------------------

const limpiarTexto = (valor) => {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
};

// La "Referencia" a veces llega como número (8713050) y Excel le agrega
// ".0"; y a veces como texto con espacios (" 8713050"). Esto lo deja limpio.
const limpiarReferencia = (valor) => {
  const texto = limpiarTexto(valor);
  if (!texto) return null;
  return texto.replace(/\.0$/, "");
};

// La columna "Año Fbcn" trae fechas completas (Date), texto en varios
// formatos ("2019-05-09", "2023/06/13") o solo el año ("2018"). Esta
// función intenta normalizar todo eso a un ISO string válido para
// guardarlo en una columna timestamptz, o null si no se puede interpretar.
const parsearFecha = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;

  if (valor instanceof Date && !isNaN(valor)) {
    return valor.toISOString();
  }

  if (typeof valor === "number") {
    // Número de serie de Excel (fecha mal formateada en la celda)
    const fechaExcel = XLSX.SSF.parse_date_code(valor);
    if (fechaExcel) {
      const fecha = new Date(
        Date.UTC(fechaExcel.y, fechaExcel.m - 1, fechaExcel.d),
      );
      if (!isNaN(fecha)) return fecha.toISOString();
    }
    return null;
  }

  const texto = String(valor).trim();
  if (!texto) return null;

  // Solo el año, ej: "2018"
  if (/^\d{4}$/.test(texto)) {
    return `${texto}-01-01T00:00:00.000Z`;
  }

  // "YYYY-MM-DD" o "YYYY/MM/DD"
  const coincidencia = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (coincidencia) {
    const [, anio, mes, dia] = coincidencia;
    const fecha = new Date(
      Date.UTC(Number(anio), Number(mes) - 1, Number(dia)),
    );
    if (!isNaN(fecha)) return fecha.toISOString();
  }

  // Último intento: dejar que el motor de JS la interprete
  const intento = new Date(texto);
  return isNaN(intento) ? null : intento.toISOString();
};

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

  // IMPORTACIÓN DESDE EXCEL
  const [importando, setImportando] = useState(false);
  const [progresoImport, setProgresoImport] = useState({ actual: 0, total: 0 });
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después

    if (!archivo) return;

    setImportando(true);
    setProgresoImport({ actual: 0, total: 0 });

    try {
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array", cellDates: true });
      const hoja = libro.Sheets[libro.SheetNames[0]];

      // header:1 -> filas como arreglos, para ubicar nosotros mismos
      // la fila de encabezados (el archivo trae un título en la fila 1).
      const filas = XLSX.utils.sheet_to_json(hoja, {
        header: 1,
        defval: null,
      });

      const idxEncabezado = filas.findIndex((fila) =>
        fila.some(
          (celda) =>
            String(celda ?? "")
              .trim()
              .toUpperCase() === "SN",
        ),
      );

      if (idxEncabezado === -1) {
        throw new Error(
          "No se encontró la fila de encabezados (CTDA., SN, Lote, Referencia...) en el archivo.",
        );
      }

      const filasDatos = filas.slice(idxEncabezado + 1);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debes iniciar sesión antes de importar.");
      }

      // Trae el catálogo de "referencia" para poder cruzar cada código del
      // Excel y autocompletar categoria_id y modelos_id en "almacenados".
      // Si algún código no aparece en este catálogo, esa fila queda con
      // categoria_id en NULL y "nombre" usa el valor genérico "Bomba".
      const { data: referencias, error: errorReferencias } = await supabase
        .from("referencia")
        .select("codigo, nombre, categoria_id, modelos_id");

      if (errorReferencias) throw errorReferencias;

      // Trae "modelos" para poder traducir referencia.modelos_id al nombre
      // real del modelo (ej. "space" -> se guardará como "Space").
      const { data: modelos, error: errorModelos } = await supabase
        .from("modelos")
        .select("id, nombre");

      if (errorModelos) throw errorModelos;

      const mapaReferencias = new Map();
      (referencias || []).forEach((ref) => {
        const codigoLimpio = limpiarReferencia(ref.codigo);
        if (codigoLimpio) mapaReferencias.set(codigoLimpio, ref);
      });

      const mapaModelos = new Map();
      (modelos || []).forEach((modelo) => {
        mapaModelos.set(modelo.id, modelo.nombre);
      });

      // "space" -> "Space", "space plus" -> "Space Plus"
      const capitalizarPalabras = (texto) =>
        texto
          .toLowerCase()
          .split(" ")
          .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(" ");

      const codigosSinCoincidencia = new Set();

      // Orden de columnas del Excel: CTDA. | SN | Lote | Referencia | Año Fbcn | Ubicaciòn
      const registros = filasDatos
        .map((fila) => {
          const [, sn, lote, referencia, anioFbcn, ubicacion] = fila;

          const serie = limpiarTexto(sn);
          const codigo = limpiarReferencia(referencia);

          // Omite filas completamente vacías
          if (!serie && !codigo && !limpiarTexto(lote)) return null;

          const refEncontrada = codigo ? mapaReferencias.get(codigo) : null;
          if (codigo && !refEncontrada) codigosSinCoincidencia.add(codigo);

          const nombreModelo = refEncontrada?.modelos_id
            ? mapaModelos.get(refEncontrada.modelos_id)
            : null;

          return {
            // "nombre" sale del modelo real (referencia -> modelos), para
            // que calce con los valores que usa el registro manual
            // (Space / Space Plus). Si no hay coincidencia o la referencia
            // no tiene modelo asignado, se usa "Bomba" como respaldo.
            nombre: nombreModelo ? capitalizarPalabras(nombreModelo) : "Bomba",
            // Nombre descriptivo de la bomba específica (catálogo "referencia")
            nombre_referencia:
              refEncontrada?.nombre || codigo || "Sin referencia",
            serie,
            lote: limpiarTexto(lote),
            ubicacion: limpiarTexto(ubicacion),
            fecha: parsearFecha(anioFbcn),
            estado: "Operativa",
            nota: null,
            categoria_id: refEncontrada?.categoria_id ?? null,
            usuario_id: user.id,
          };
        })
        .filter(Boolean);

      if (registros.length === 0) {
        throw new Error("No se encontraron filas válidas para importar.");
      }

      // Inserta en lotes para no exceder límites de tamaño de petición
      const TAMANO_LOTE = 500;
      let insertados = 0;

      setProgresoImport({ actual: 0, total: registros.length });

      for (let i = 0; i < registros.length; i += TAMANO_LOTE) {
        const lote = registros.slice(i, i + TAMANO_LOTE);
        const { error } = await supabase.from("almacenados").insert(lote);
        if (error) throw error;
        insertados += lote.length;
        setProgresoImport({ actual: insertados, total: registros.length });
      }

      await Swal.fire({
        title: "📦 Importación completa",
        html: `Se importaron <b>${insertados}</b> de ${filasDatos.length} filas leídas correctamente.${
          codigosSinCoincidencia.size > 0
            ? `<br/><br/>⚠️ <b>${codigosSinCoincidencia.size}</b> código(s) no se encontraron en la tabla "referencia" (quedaron sin categoría): <br/><span style="font-size:0.85em">${[...codigosSinCoincidencia].join(", ")}</span>`
            : ""
        }`,
        icon: "success",
        confirmButtonColor: "#0891b2",
      });

      setPage(1);
      obtenerDatos(1);
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error al importar",
        text: error.message || "Ocurrió un error al procesar el archivo.",
        icon: "error",
        confirmButtonColor: "#0891b2",
      });
    } finally {
      setImportando(false);
      setProgresoImport({ actual: 0, total: 0 });
    }
  };

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
    const d = new Date(fecha);
    if (isNaN(d)) return "-";
    // Se usa UTC para que no se corra un día por el huso horario local,
    // ya que muchas fechas importadas solo tienen el año (sin hora real).
    const anio = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(d.getUTCDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
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
      {/* OVERLAY DE PROGRESO DE IMPORTACIÓN */}
      {importando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaSpinner className="animate-spin text-cyan-600 text-2xl shrink-0" />
              <p className="text-slate-800 font-semibold">
                Importando Excel...
              </p>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-cyan-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: progresoImport.total
                    ? `${Math.round(
                        (progresoImport.actual / progresoImport.total) * 100,
                      )}%`
                    : "15%",
                }}
              />
            </div>

            <p className="text-slate-500 text-sm mt-2 text-center">
              {progresoImport.total
                ? `${progresoImport.actual} de ${progresoImport.total} registros (${Math.round(
                    (progresoImport.actual / progresoImport.total) * 100,
                  )}%)`
                : "Leyendo archivo..."}
            </p>
          </div>
        </div>
      )}

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

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleImportClick}
              disabled={importando}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl shadow-md transition text-sm md:text-base"
            >
              {importando ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileExcel />
              )}
              {importando ? "Importando..." : "Importar Excel"}
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
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">
                      {item.nombre || "Sin nombre"}
                    </h3>
                    {item.nombre_referencia && (
                      <p className="text-slate-500 text-sm leading-snug">
                        {item.nombre_referencia}
                      </p>
                    )}
                  </div>
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

                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-semibold">
                      Ubicación
                    </span>
                    <span className="text-slate-700">
                      {item.ubicacion || "-"}
                    </span>
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
                    <th className="px-6 py-5 text-left">Nombre Referencia</th>
                    <th className="px-6 py-5 text-left">Responsable</th>
                    <th className="px-6 py-5 text-left">Serie</th>
                    <th className="px-6 py-5 text-left">Lote</th>
                    <th className="px-6 py-5 text-left">Ubicación</th>
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
                        {item.nombre_referencia || "-"}
                      </td>
                      <td className="px-6 py-5">
                        {item.nombre_responsable || "-"}
                      </td>
                      <td className="px-6 py-5">{item.serie || "-"}</td>
                      <td className="px-6 py-5">{item.lote || "-"}</td>
                      <td className="px-6 py-5">{item.ubicacion || "-"}</td>
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
