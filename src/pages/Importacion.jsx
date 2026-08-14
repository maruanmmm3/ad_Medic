import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import {
  FaFileImport,
  FaArrowLeft,
  FaFileExcel,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSpinner,
  FaTrash,
  FaTag,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────
// Configuración de cada tabla: columnas booleanas y si serie_lote
// es obligatorio (según tu esquema NOT NULL en Supabase).
// ─────────────────────────────────────────────────────────────
const TABLAS_CONFIG = {
  bombas: {
    label: "Bombas",
    requiereSerie: true,
    columnas: [
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
    requiereSerie: false,
    columnas: [
      { key: "recoleccion", label: "Recolección" },
      { key: "recuperacion", label: "Recuperación" },
      { key: "base", label: "Base" },
      { key: "pintura", label: "Pintura" },
      { key: "limpieza", label: "Limpieza" },
      { key: "empaquetado", label: "Empaquetado" },
    ],
  },
  fuentespoder: {
    label: "Fuentes de Poder",
    requiereSerie: false,
    columnas: [
      { key: "recoleccion", label: "Recolección" },
      { key: "reparacion", label: "Reparación" },
      { key: "limpieza", label: "Limpieza" },
      { key: "etiqueta", label: "Etiqueta" },
      { key: "empaquetado", label: "Empaquetado" },
    ],
  },
  baterias: {
    label: "Baterías",
    requiereSerie: true,
    columnas: [
      { key: "mantenimiento", label: "Mantenimiento" },
      { key: "prueba", label: "Prueba" },
    ],
  },
};

// Alias que se aceptan en la columna "Tipo" del Excel, para cada tabla
const TIPO_ALIASES = {
  bombas: ["bomba", "bombas"],
  poles: ["pole", "poles"],
  fuentespoder: [
    "fuente de poder",
    "fuentes de poder",
    "fuente poder",
    "fuentespoder",
    "fuente",
  ],
  baterias: ["bateria", "baterias", "batería", "baterías"],
};

const ALIAS_TIPO = ["tipo", "tabla", "tipo de equipo"];
const ALIAS_NOMBRE = ["nombre", "equipo", "nombre equipo", "nombre del equipo"];
const ALIAS_SERIE = ["serie_lote", "serie/lote", "serie lote", "serie", "lote"];
const ALIAS_CATEGORIA = ["categoria", "categoría", "categoria_id"];

// Quita tildes y normaliza a minúsculas para comparar encabezados/valores sin ser estricto
function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseBooleano(valor) {
  if (typeof valor === "boolean") return valor;
  const v = normalizar(valor);
  return ["si", "x", "true", "1", "yes", "verdadero"].includes(v);
}

function obtenerValor(filaNormalizada, alias) {
  for (const a of alias) {
    const encontrado = filaNormalizada[normalizar(a)];
    if (encontrado !== undefined && encontrado !== "") return encontrado;
  }
  return undefined;
}

function resolverTabla(valorTipo) {
  const v = normalizar(valorTipo);
  if (!v) return null;
  for (const [tabla, alias] of Object.entries(TIPO_ALIASES)) {
    if (alias.some((a) => normalizar(a) === v)) return tabla;
  }
  return null;
}

// Une, sin duplicar por texto, todas las columnas de actividad de las 4 tablas (para la plantilla)
const COLUMNAS_UNION = (() => {
  const vistas = new Set();
  const union = [];
  Object.values(TABLAS_CONFIG).forEach((cfg) => {
    cfg.columnas.forEach(({ label }) => {
      const norm = normalizar(label);
      if (!vistas.has(norm)) {
        vistas.add(norm);
        union.push(label);
      }
    });
  });
  return union;
})();

export default function Importacion() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  const [nombreArchivo, setNombreArchivo] = useState("");
  const [filas, setFilas] = useState([]);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState(null);

  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    setCargandoCategorias(true);
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    if (!error) setCategorias(data ?? []);
    setCargandoCategorias(false);
  }

  // Busca una categoría por nombre (sin tildes/mayúsculas) dentro de las cargadas
  function resolverCategoria(valorCategoria) {
    const texto = (valorCategoria ?? "").toString().trim();
    if (!texto) return { id: null, encontrada: true }; // vacío = sin categoría, válido

    const norm = normalizar(texto);
    const match = categorias.find((c) => normalizar(c.nombre) === norm);
    return match ? { id: match.id, encontrada: true } : { id: null, encontrada: false };
  }

  function limpiarArchivo() {
    setNombreArchivo("");
    setFilas([]);
    setErrorArchivo(null);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function descargarPlantilla() {
    const encabezados = ["Tipo", "Nombre", "Serie/Lote", "Categoría", ...COLUMNAS_UNION];
    const filaEjemplo = [
      "Bomba",
      "Bomba de infusión 01",
      "SL-1234",
      categorias[0]?.nombre ?? "",
      ...COLUMNAS_UNION.map(() => ""),
    ];

    const hojaDatos = XLSX.utils.aoa_to_sheet([encabezados, filaEjemplo]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hojaDatos, "Equipos");

    const instrucciones = [
      ["Columna 'Tipo' — valores aceptados:"],
      ["Bomba", "→ Bombas"],
      ["Pole", "→ Poles"],
      ["Fuente de Poder", "→ Fuentes de Poder"],
      ["Batería", "→ Baterías"],
      [],
      ["Columna 'Categoría' — escribe el nombre exacto de una categoría existente."],
      ["Déjala en blanco si el equipo no tiene categoría."],
      ["Categorías disponibles:"],
      ...categorias.map((c) => [c.nombre]),
      [],
      ["'Serie/Lote' es obligatorio solo para Bomba y Batería."],
      ["Marca las actividades con: Sí / X / 1 (deja en blanco si no aplica)."],
      [
        "Solo se usarán las columnas de actividad correspondientes al Tipo de cada fila;",
      ],
      ["el resto se ignora."],
    ];
    const hojaInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
    XLSX.utils.book_append_sheet(libro, hojaInstrucciones, "Instrucciones");

    XLSX.writeFile(libro, "plantilla_importacion.xlsx");
  }

  function mapearFila(rowRaw) {
    const filaNorm = Object.fromEntries(
      Object.entries(rowRaw).map(([k, v]) => [normalizar(k), v]),
    );

    const tipoRaw = obtenerValor(filaNorm, ALIAS_TIPO);
    const tabla = resolverTabla(tipoRaw);
    const nombre = obtenerValor(filaNorm, ALIAS_NOMBRE)?.toString().trim() ?? "";
    const serieLoteRaw = obtenerValor(filaNorm, ALIAS_SERIE);
    const categoriaRaw = obtenerValor(filaNorm, ALIAS_CATEGORIA);

    const errores = [];
    if (!tabla) {
      errores.push(
        `Tipo "${tipoRaw ?? ""}" no reconocido (usa Bomba, Pole, Fuente de Poder o Batería)`,
      );
    }
    if (!nombre) errores.push("Falta el nombre");

    const config = tabla ? TABLAS_CONFIG[tabla] : null;
    const serie_lote = serieLoteRaw?.toString().trim() ?? "";

    if (config?.requiereSerie && !serie_lote) {
      errores.push("Falta la serie/lote");
    }

    const { id: categoria_id, encontrada } = resolverCategoria(categoriaRaw);
    if (!encontrada) {
      errores.push(`Categoría "${categoriaRaw}" no existe`);
    }

    const actividades = {};
    if (config) {
      config.columnas.forEach(({ key, label }) => {
        actividades[key] = parseBooleano(obtenerValor(filaNorm, [key, label]));
      });
    }

    return {
      tipoOriginal: tipoRaw ?? "",
      tabla,
      tablaLabel: config?.label ?? "—",
      nombre,
      serie_lote,
      categoriaTexto: (categoriaRaw ?? "").toString().trim(),
      categoria_id,
      actividades,
      _valido: errores.length === 0,
      _errores: errores,
    };
  }

  async function handleArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setProcesandoArchivo(true);
    setErrorArchivo(null);
    setResultado(null);
    setNombreArchivo(archivo.name);

    try {
      const datos = await archivo.arrayBuffer();
      const libro = XLSX.read(datos, { type: "array" });
      const primeraHoja = libro.Sheets[libro.SheetNames[0]];
      const filasJson = XLSX.utils.sheet_to_json(primeraHoja, { defval: "" });

      if (filasJson.length === 0) {
        setErrorArchivo("El archivo no contiene filas de datos.");
        setFilas([]);
        return;
      }

      setFilas(filasJson.map(mapearFila));
    } catch (err) {
      console.error(err);
      setErrorArchivo(
        "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx).",
      );
      setFilas([]);
    } finally {
      setProcesandoArchivo(false);
    }
  }

  function eliminarFila(indice) {
    setFilas((prev) => prev.filter((_, i) => i !== indice));
  }

  const filasValidas = filas.filter((f) => f._valido);
  const filasInvalidas = filas.filter((f) => !f._valido);

  const conteoPorTabla = Object.keys(TABLAS_CONFIG).reduce((acc, tabla) => {
    acc[tabla] = filasValidas.filter((f) => f.tabla === tabla).length;
    return acc;
  }, {});

  async function handleImportar() {
    if (filasValidas.length === 0) return;

    setImportando(true);
    setResultado(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user?.id) throw new Error("No se encontró una sesión activa.");

      // Agrupar filas válidas por tabla destino
      const grupos = {};
      filasValidas.forEach((f) => {
        if (!grupos[f.tabla]) grupos[f.tabla] = [];
        const fila = {
          nombre: f.nombre,
          categoria_id: f.categoria_id, // ← ahora viene por fila, no de un selector global
          usuario_id: user.id,
          ...f.actividades,
        };
        if (f.serie_lote) fila.serie_lote = f.serie_lote;
        grupos[f.tabla].push(fila);
      });

      const resultadosPorTabla = await Promise.all(
        Object.entries(grupos).map(async ([tabla, payload]) => {
          const { error } = await supabase.from(tabla).insert(payload);
          return {
            tabla,
            label: TABLAS_CONFIG[tabla].label,
            cantidad: payload.length,
            error,
          };
        }),
      );

      const exitosos = resultadosPorTabla.filter((r) => !r.error);
      const fallidos = resultadosPorTabla.filter((r) => r.error);

      if (fallidos.length > 0) {
        fallidos.forEach((f) => console.error(`Error en ${f.tabla}:`, f.error));
      }

      setResultado({
        esError: exitosos.length === 0,
        detalle: resultadosPorTabla,
        totalImportados: exitosos.reduce((acc, r) => acc + r.cantidad, 0),
        omitidos: filasInvalidas.length,
      });

      if (fallidos.length === 0) {
        setFilas([]);
        setNombreArchivo("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      setResultado({
        esError: true,
        mensajeGeneral: err.message ?? "Ocurrió un error al importar los registros.",
      });
    } finally {
      setImportando(false);
    }
  }

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
          <FaFileImport className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Importación
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Carga masiva de equipos médicos desde un solo archivo Excel.
          </p>
        </div>
      </div>

      {/* Panel de plantilla */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">
          1. Descarga la plantilla
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          La plantilla trae las columnas <strong>Tipo</strong> (Bomba, Pole,
          Fuente de Poder o Batería) y <strong>Categoría</strong> (el nombre
          exacto de una categoría existente, o vacío si no aplica). Puedes
          mezclar todos los tipos y categorías en el mismo archivo.
        </p>

        {cargandoCategorias ? (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <FaSpinner className="w-3.5 h-3.5 animate-spin" />
            Cargando categorías...
          </p>
        ) : categorias.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categorias.map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
              >
                {c.nombre}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-600 mb-4">
            No tienes categorías creadas todavía — puedes dejar esa columna
            vacía en el Excel.
          </p>
        )}

        <button
          onClick={descargarPlantilla}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 text-sm font-medium"
        >
          <FaDownload className="w-3.5 h-3.5" />
          Descargar plantilla
        </button>
      </div>

      {/* Panel de carga de archivo */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          2. Sube tu archivo Excel
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 cursor-pointer w-fit">
            <FaFileExcel className="w-4 h-4" />
            Seleccionar archivo
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </label>

          {nombreArchivo && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FaFileExcel className="w-4 h-4 text-emerald-600" />
              {nombreArchivo}
              <button
                onClick={limpiarArchivo}
                className="text-slate-400 hover:text-red-500"
                title="Quitar archivo"
              >
                <FaTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {procesandoArchivo && (
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-4">
            <FaSpinner className="w-4 h-4 animate-spin" />
            Leyendo archivo...
          </div>
        )}

        {errorArchivo && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm mt-4">
            <FaExclamationCircle className="w-4 h-4 shrink-0" />
            {errorArchivo}
          </div>
        )}
      </div>

      {/* Previsualización */}
      {filas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              3. Revisa los registros antes de importar
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {Object.entries(TABLAS_CONFIG).map(
                ([tabla, cfg]) =>
                  conteoPorTabla[tabla] > 0 && (
                    <span
                      key={tabla}
                      className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200"
                    >
                      {cfg.label}: {conteoPorTabla[tabla]}
                    </span>
                  ),
              )}
              {filasInvalidas.length > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                  {filasInvalidas.length} con errores
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Nombre</th>
                  <th className="py-2 pr-4 font-medium">Serie/Lote</th>
                  <th className="py-2 pr-4 font-medium">Categoría</th>
                  <th className="py-2 pr-4 font-medium">Actividades marcadas</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, idx) => {
                  const config = f.tabla ? TABLAS_CONFIG[f.tabla] : null;
                  const marcadas = config
                    ? config.columnas
                        .filter((c) => f.actividades[c.key])
                        .map((c) => c.label)
                    : [];

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-slate-100 last:border-0 align-top ${
                        f._valido ? "hover:bg-slate-50" : "bg-red-50/60"
                      }`}
                    >
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {f.tabla ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            <FaTag className="w-3 h-3" />
                            {f.tablaLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {f.tipoOriginal || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700 whitespace-nowrap">
                        {f.nombre || "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                        {f.serie_lote || "—"}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {f.categoriaTexto ? (
                          <span className="text-slate-600">
                            {f.categoriaTexto}
                          </span>
                        ) : (
                          <span className="text-slate-300">Sin categoría</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 max-w-xs">
                        {marcadas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {marcadas.map((m) => (
                              <span
                                key={m}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs border border-emerald-200"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">
                            Ninguna
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {f._valido ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                            <FaCheckCircle className="w-3 h-3" />
                            Listo
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-200"
                            title={f._errores.join(", ")}
                          >
                            <FaExclamationCircle className="w-3 h-3" />
                            {f._errores.join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <button
                          onClick={() => eliminarFila(idx)}
                          className="text-slate-400 hover:text-red-500"
                          title="Quitar fila"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handleImportar}
              disabled={filasValidas.length === 0 || importando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importando ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FaFileImport className="w-4 h-4" />
                  Importar {filasValidas.length} registro(s)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resultado de la importación */}
      {resultado && (
        <div
          className={`rounded-xl shadow-sm p-5 md:p-6 ${
            resultado.esError
              ? "bg-red-50 border border-red-200"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {resultado.esError ? (
              <FaExclamationCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <FaCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {resultado.mensajeGeneral ? (
                <p className="font-medium text-red-700">
                  {resultado.mensajeGeneral}
                </p>
              ) : (
                <>
                  <p
                    className={`font-medium ${
                      resultado.esError ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    Se importaron {resultado.totalImportados} registro(s) en
                    total.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {resultado.detalle.map((d) => (
                      <li key={d.tabla} className="flex items-center gap-2">
                        {d.error ? (
                          <FaTimesCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span className="text-slate-700">
                          {d.label}: {d.error ? "falló" : `${d.cantidad} importado(s)`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {resultado.omitidos > 0 && (
                    <p className="text-sm text-slate-500 mt-2">
                      {resultado.omitidos} fila(s) se omitieron por tener
                      errores.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}