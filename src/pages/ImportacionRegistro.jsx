import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import {
  FaFileImport,
  FaArrowLeft,
  FaFileExcel,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSpinner,
  FaTrash,
  FaHashtag,
  FaCalendarAlt,
  FaListOl,
  FaClock,
  FaBoxOpen,
} from "react-icons/fa";

// Formatea una fecha (ISO o cualquier valor parseable) a texto legible.
function formatearFecha(valor, conHora = false) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "—";
  return conHora
    ? fecha.toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

// Determina si una fecha cae dentro de la semana actual (lunes a domingo).
function esSemanaActual(valor) {
  if (!valor) return false;
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return false;

  const ahora = new Date();
  const diaSemana = (ahora.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo

  const inicioSemana = new Date(ahora);
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(ahora.getDate() - diaSemana);

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 7);

  return fecha >= inicioSemana && fecha < finSemana;
}

// ─────────────────────────────────────────────────────────────
// Config: celdas fijas donde vive cada dato en la PRIMERA hoja
// del archivo (según el formato "ENTREGA DE EQUIPOS A ALMACÉN").
// ─────────────────────────────────────────────────────────────
const CELDA_FECHA_INICIO = "C9"; // Fecha del formulario
const CELDA_NUMERO_PEDIDO = "J9"; // Nro. de pedido/documento

// Encabezados que marcan el inicio de cada una de las 4 tablas de equipos.
// Se buscan en la misma fila para ubicar dinámicamente las columnas de
// cada dato, sin importar en qué columna caigan ni cuántas tablas haya.
const HEADERS_TABLA = ["ID", "CODIGO", "NOMBRE", "UBICACION", "ESTADO"];

// Mapea el campo "tipo" de la tabla categorias (normalizado, sin espacios)
// al nombre real de la tabla en Supabase.
const TABLA_POR_TIPO = {
  BOMBA: "bombas",
  POLE: "poles",
  FUENTEPODER: "fuentespoder",
  BATERIA: "baterias",
  POWERCORD: "powercord",
};

// Nombre "bonito" de cada tabla, solo para mostrarlo en el resultado.
const LABEL_TABLA = {
  bombas: "Bombas",
  poles: "Poles",
  fuentespoder: "Fuentes de Poder",
  baterias: "Baterías",
  powercord: "Power Cords",
};

// Columnas booleanas propias de cada tabla — todas se guardan en true.
const BOOLEANOS_POR_TABLA = {
  bombas: [
    "recoleccion",
    "limpieza",
    "prueba_can",
    "reparacion",
    "actualizacion",
    "tsc",
    "empaque",
  ],
  poles: [
    "recoleccion",
    "recuperacion",
    "base",
    "pintura",
    "limpieza",
    "empaquetado",
  ],
  fuentespoder: [
    "recoleccion",
    "reparacion",
    "limpieza",
    "etiqueta",
    "empaquetado",
  ],
  baterias: ["mantenimiento", "prueba", "cargatotal"],
  powercord: ["limpieza", "prueba", "empaque"],
};

// baterias y powercord no tienen columna "nombre" en su esquema.
const TABLAS_CON_NOMBRE = new Set(["bombas", "poles", "fuentespoder"]);

// powercord no tiene columna "serie": el valor de "SERIE / LOTE" del Excel
// se guarda ahí directamente en "lote". El resto de tablas sí usan "serie".
const TABLAS_CON_SERIE = new Set([
  "bombas",
  "poles",
  "fuentespoder",
  "baterias",
]);

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Si la celda pedida está vacía porque forma parte de un rango combinado
// (merged cell), busca el rango al que pertenece y devuelve la celda
// "maestra" (arriba-izquierda), que es la única que SheetJS llena de valor.
function resolverCeldaCombinada(hoja, direccion) {
  const celdaDirecta = hoja[direccion];
  if (celdaDirecta && celdaDirecta.v !== undefined && celdaDirecta.v !== "") {
    return celdaDirecta;
  }

  const combinaciones = hoja["!merges"] || [];
  const { r, c } = XLSX.utils.decode_cell(direccion);

  for (const rango of combinaciones) {
    if (r >= rango.s.r && r <= rango.e.r && c >= rango.s.c && c <= rango.e.c) {
      const celdaMaestra = hoja[XLSX.utils.encode_cell(rango.s)];
      if (celdaMaestra) return celdaMaestra;
    }
  }

  return celdaDirecta;
}

// El texto completo suele venir como "001 - Nro 0004___". Nos interesa solo
// el número después de "Nro", sin ceros a la izquierda (ej. "4").
function extraerNumeroPedido(textoCompleto) {
  const texto = (textoCompleto ?? "").toString().trim();
  if (!texto) return "";

  const match = texto.match(/nro\.?\s*0*(\d+)/i);
  if (match) return match[1];

  // Si no matchea el patrón "Nro ####", como respaldo tomamos cualquier
  // número que aparezca en el texto.
  const soloNumero = texto.match(/(\d+)/);
  if (soloNumero) return soloNumero[1].replace(/^0+(?=\d)/, "");

  return texto;
}

// Convierte el valor crudo de una celda (Date, número serial de Excel o
// texto "YYYY-MM-DD") a un string ISO utilizable como timestamptz.
function celdaAFechaISO(celda) {
  if (!celda) return null;

  if (celda.t === "d" && celda.v instanceof Date) {
    return celda.v.toISOString();
  }

  if (typeof celda.v === "number") {
    const fecha = XLSX.SSF.parse_date_code(celda.v);
    if (fecha) {
      return new Date(
        Date.UTC(
          fecha.y,
          fecha.m - 1,
          fecha.d,
          fecha.H ?? 0,
          fecha.M ?? 0,
          fecha.S ?? 0,
        ),
      ).toISOString();
    }
  }

  const texto = (celda.w ?? celda.v ?? "").toString().trim();
  const fechaParsed = new Date(texto);
  if (!isNaN(fechaParsed.getTime())) return fechaParsed.toISOString();

  return null;
}

// Recorre toda la hoja buscando cada bloque de tabla. Una misma fila de
// encabezado puede tener MÁS DE UNA tabla repetida una al lado de la otra
// (por ejemplo, dos copias del mismo formulario impreso en la misma hoja):
// cada "ID" que aparece en la fila marca el inicio de un bloque distinto.
// Para cada bloque se ubican dinámicamente sus propias columnas de CODIGO,
// NOMBRE, UBICACION, ESTADO y SERIE/LOTE, y se extrae cada fila con datos
// reales debajo de su encabezado.
function extraerFilasEquipos(hoja) {
  const rango = XLSX.utils.decode_range(hoja["!ref"]);
  const filas = [];
  let bloquesEncontrados = 0;

  const valorCelda = (fila, col) =>
    (hoja[XLSX.utils.encode_cell({ r: fila, c: col })]?.v ?? "")
      .toString()
      .trim();

  for (let fila = rango.s.r; fila <= rango.e.r; fila++) {
    // Recolectar todas las celdas de encabezado presentes en esta fila
    const encabezados = [];
    for (let col = rango.s.c; col <= rango.e.c; col++) {
      const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: col })];
      const valor = normalizar(celda?.v);
      if (!valor) continue;

      if (valor.includes("SERIE")) {
        encabezados.push({ col, clave: "SERIE" });
      } else if (HEADERS_TABLA.includes(valor)) {
        encabezados.push({ col, clave: valor });
      }
    }

    // Cada "ID" marca el inicio de una tabla distinta en esta misma fila
    const iniciosBloque = encabezados
      .filter((e) => e.clave === "ID")
      .map((e) => e.col);
    if (iniciosBloque.length === 0) continue;

    iniciosBloque.forEach((inicioCol, idx) => {
      const finCol =
        idx + 1 < iniciosBloque.length ? iniciosBloque[idx + 1] - 1 : rango.e.c;

      const columnasBloque = {};
      encabezados
        .filter((e) => e.col >= inicioCol && e.col <= finCol)
        .forEach((e) => {
          if (columnasBloque[e.clave] === undefined)
            columnasBloque[e.clave] = e.col;
        });

      if (
        columnasBloque.CODIGO === undefined ||
        columnasBloque.NOMBRE === undefined
      )
        return;

      bloquesEncontrados++;
      const {
        CODIGO: colCodigo,
        NOMBRE: colNombre,
        UBICACION: colUbicacion,
        ESTADO: colEstado,
        SERIE: colSerie,
      } = columnasBloque;

      let filaLectura = fila + 1;
      let vaciasSeguidas = 0;
      while (filaLectura <= rango.e.r && vaciasSeguidas < 3) {
        const codigo = valorCelda(filaLectura, colCodigo);
        const nombre = valorCelda(filaLectura, colNombre);

        if (codigo || nombre) {
          filas.push({
            codigo,
            nombre,
            ubicacion:
              colUbicacion !== undefined
                ? valorCelda(filaLectura, colUbicacion)
                : "",
            estado:
              colEstado !== undefined ? valorCelda(filaLectura, colEstado) : "",
            serieLote:
              colSerie !== undefined ? valorCelda(filaLectura, colSerie) : "",
          });
          vaciasSeguidas = 0;
        } else {
          vaciasSeguidas++;
        }
        filaLectura++;
      }
    });
  }

  return { filas, bloquesEncontrados };
}

export default function ImportacionRegistro() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [nombreArchivo, setNombreArchivo] = useState("");
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState(null);

  const [datosExtraidos, setDatosExtraidos] = useState(null);
  // { numero_pedido, fecha_inicio, fecha_inicio_texto, cantidad_datos, bloquesEncontrados }

  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [registros, setRegistros] = useState([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  useEffect(() => {
    cargarRegistros();
  }, []);

  async function cargarRegistros() {
    setCargandoRegistros(true);
    const { data, error } = await supabase
      .from("registroimportacion")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRegistros(data ?? []);
    setCargandoRegistros(false);
  }

  async function handleEliminar(id) {
    const confirmar = window.confirm(
      "¿Eliminar este registro de importación? Esta acción no se puede deshacer.",
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("registroimportacion")
      .delete()
      .eq("id", id);

    if (!error) {
      setRegistros((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function limpiarArchivo() {
    setNombreArchivo("");
    setDatosExtraidos(null);
    setErrorArchivo(null);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setProcesandoArchivo(true);
    setErrorArchivo(null);
    setResultado(null);
    setDatosExtraidos(null);
    setNombreArchivo(archivo.name);

    try {
      const datos = await archivo.arrayBuffer();
      const libro = XLSX.read(datos, { type: "array", cellDates: true });

      if (!libro.SheetNames?.length) {
        setErrorArchivo("El archivo no tiene ninguna hoja legible.");
        return;
      }

      // No asumimos una hoja fija: recorremos todas y usamos la primera
      // donde realmente se pueda leer un número de pedido y una fecha
      // válidos en J9/C9 (ya resolviendo celdas combinadas). Esto evita
      // fallar cuando el orden de hojas cambia entre archivos.
      let hojaValida = null;
      let numero_pedido = "";
      let fecha_inicio = null;
      let fecha_inicio_texto = "";

      for (const nombreHoja of libro.SheetNames) {
        const hojaActual = libro.Sheets[nombreHoja];
        if (!hojaActual) continue;

        const celdaPedido = resolverCeldaCombinada(
          hojaActual,
          CELDA_NUMERO_PEDIDO,
        );
        const textoPedidoCompleto = (celdaPedido?.w ?? celdaPedido?.v ?? "")
          .toString()
          .trim();
        const pedidoCandidato = extraerNumeroPedido(textoPedidoCompleto);

        const celdaFecha = resolverCeldaCombinada(
          hojaActual,
          CELDA_FECHA_INICIO,
        );
        const fechaCandidata = celdaAFechaISO(celdaFecha);

        if (pedidoCandidato && fechaCandidata) {
          hojaValida = hojaActual;
          numero_pedido = pedidoCandidato;
          fecha_inicio = fechaCandidata;
          fecha_inicio_texto = (celdaFecha?.w ?? celdaFecha?.v ?? "")
            .toString()
            .trim();
          break;
        }
      }

      if (!hojaValida) {
        setErrorArchivo(
          `No se encontró un número de pedido (${CELDA_NUMERO_PEDIDO}) y una fecha (${CELDA_FECHA_INICIO}) válidos en ninguna hoja del archivo.`,
        );
        return;
      }

      const { filas: filasEquipos, bloquesEncontrados } =
        extraerFilasEquipos(hojaValida);

      if (bloquesEncontrados === 0) {
        setErrorArchivo(
          "No se encontraron tablas de equipos (encabezados ID / CODIGO / NOMBRE) en la hoja.",
        );
        return;
      }

      setDatosExtraidos({
        numero_pedido,
        fecha_inicio,
        fecha_inicio_texto,
        cantidad_datos: filasEquipos.length,
        bloquesEncontrados,
        filasEquipos,
      });
    } catch (err) {
      console.error(err);
      setErrorArchivo(
        "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx).",
      );
    } finally {
      setProcesandoArchivo(false);
    }
  }

  async function handleImportar() {
    if (!datosExtraidos) return;

    setImportando(true);
    setResultado(null);

    try {
      // 1) Dejar constancia de la importación en sí
      const { error: errorRegistro } = await supabase
        .from("registroimportacion")
        .insert({
          nombre_archivo: nombreArchivo,
          numero_pedido: datosExtraidos.numero_pedido,
          cantidad_datos: datosExtraidos.cantidad_datos,
          fecha_inicio: datosExtraidos.fecha_inicio,
          fecha_importacion: new Date().toISOString(),
        });
      if (errorRegistro) throw errorRegistro;

      // 2) Usuario actual (para usuario_id en cada equipo)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.id) throw new Error("No se encontró una sesión activa.");

      const filas = datosExtraidos.filasEquipos ?? [];
      const codigosUnicos = [
        ...new Set(filas.map((f) => f.codigo).filter(Boolean)),
      ];

      const omitidos = [];
      const grupos = {}; // tabla destino -> filas a insertar

      if (codigosUnicos.length > 0) {
        // 3) Ubicar cada código en la tabla "referencia" para saber su categoría
        const { data: referencias, error: errorReferencia } = await supabase
          .from("referencia")
          .select("codigo, categoria_id")
          .in("codigo", codigosUnicos);
        if (errorReferencia) throw errorReferencia;

        const mapaReferencia = new Map(
          (referencias ?? []).map((r) => [
            (r.codigo ?? "").toString().trim(),
            r.categoria_id,
          ]),
        );

        const categoriaIdsUnicos = [
          ...new Set(
            (referencias ?? [])
              .map((r) => r.categoria_id)
              .filter((id) => id !== null && id !== undefined),
          ),
        ];

        // 4) Ver el "tipo" de cada categoría, que dice a qué tabla va cada equipo
        let mapaCategoria = new Map();
        if (categoriaIdsUnicos.length > 0) {
          const { data: categoriasData, error: errorCategorias } =
            await supabase
              .from("categorias")
              .select("id, tipo")
              .in("id", categoriaIdsUnicos);
          if (errorCategorias) throw errorCategorias;
          mapaCategoria = new Map(
            (categoriasData ?? []).map((c) => [c.id, c.tipo]),
          );
        }

        // 5) Armar el registro de cada equipo para su tabla correspondiente
        for (const fila of filas) {
          const categoria_id = mapaReferencia.get(fila.codigo);

          if (categoria_id === undefined) {
            omitidos.push({
              ...fila,
              motivo: `Código "${fila.codigo}" no existe en referencia`,
            });
            continue;
          }

          const tipoRaw = mapaCategoria.get(categoria_id);
          const tipoClave = normalizar(tipoRaw).replace(/\s+/g, "");
          const tabla = TABLA_POR_TIPO[tipoClave];

          if (!tabla) {
            omitidos.push({
              ...fila,
              motivo: `Tipo "${tipoRaw ?? ""}" (categoría ${categoria_id}) no tiene tabla asignada`,
            });
            continue;
          }

          const registro = {
            categoria_id,
            usuario_id: user.id,
            fecha: datosExtraidos.fecha_inicio,
            pedido: datosExtraidos.numero_pedido,
            ubicacion: fila.ubicacion || null,
            estado: fila.estado || null,
          };

          if (TABLAS_CON_NOMBRE.has(tabla)) registro.nombre = fila.nombre;

          if (fila.serieLote) {
            if (TABLAS_CON_SERIE.has(tabla)) registro.serie = fila.serieLote;
            else registro.lote = fila.serieLote; // powercord no tiene "serie"
          }

          BOOLEANOS_POR_TABLA[tabla].forEach((campo) => {
            registro[campo] = true;
          });

          if (!grupos[tabla]) grupos[tabla] = [];
          grupos[tabla].push(registro);
        }
      }

      // 6) Insertar cada grupo en su tabla
      const detallePorTabla = await Promise.all(
        Object.entries(grupos).map(async ([tabla, payload]) => {
          const { error } = await supabase.from(tabla).insert(payload);
          return {
            tabla,
            label: LABEL_TABLA[tabla] ?? tabla,
            cantidad: payload.length,
            error,
          };
        }),
      );

      const fallidos = detallePorTabla.filter((d) => d.error);
      fallidos.forEach((d) =>
        console.error(`Error insertando en ${d.tabla}:`, d.error),
      );

      const esErrorGlobal =
        detallePorTabla.length > 0 &&
        fallidos.length === detallePorTabla.length;

      setResultado({ esError: esErrorGlobal, detallePorTabla, omitidos });
      limpiarArchivo();
      cargarRegistros();
    } catch (err) {
      console.error(err);
      setResultado({
        esError: true,
        mensajeGeneral:
          err.message ?? "Ocurrió un error al importar el registro.",
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
            Importación de registro
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Sube el Excel de entrega de equipos para registrar la importación.
          </p>
        </div>
      </div>

      {/* Panel de carga de archivo */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Sube tu archivo Excel
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
      {datosExtraidos && (
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Revisa los datos antes de importar
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <FaFileExcel className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Nombre del archivo</p>
                <p className="text-sm font-medium text-slate-800 break-all">
                  {nombreArchivo}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <FaHashtag className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Número de pedido (J9)</p>
                <p className="text-sm font-medium text-slate-800">
                  {datosExtraidos.numero_pedido}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <FaCalendarAlt className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Fecha de inicio (C9)</p>
                <p className="text-sm font-medium text-slate-800">
                  {datosExtraidos.fecha_inicio_texto}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <FaListOl className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">
                  Cantidad de datos ({datosExtraidos.bloquesEncontrados} tabla
                  {datosExtraidos.bloquesEncontrados === 1 ? "" : "s"}{" "}
                  encontrada
                  {datosExtraidos.bloquesEncontrados === 1 ? "" : "s"})
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {datosExtraidos.cantidad_datos}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleImportar}
              disabled={importando}
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
                  Importar registro
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
              <FaTimesCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
                    Registro de importación guardado correctamente.
                  </p>

                  {resultado.detallePorTabla?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {resultado.detallePorTabla.map((d) => (
                        <li key={d.tabla} className="flex items-center gap-2">
                          {d.error ? (
                            <FaTimesCircle className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-slate-700">
                            {d.label}:{" "}
                            {d.error
                              ? "falló"
                              : `${d.cantidad} equipo(s) importado(s)`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {resultado.omitidos?.length > 0 && (
                    <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="font-medium mb-1">
                        {resultado.omitidos.length} fila(s) omitida(s):
                      </p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        {resultado.omitidos.map((o, i) => (
                          <li key={i}>
                            {o.codigo || "(sin código)"} —{" "}
                            {o.nombre || "(sin nombre)"}: {o.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial de importaciones, en tarjetas */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Historial de importaciones
        </h2>

        {cargandoRegistros ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <FaSpinner className="w-4 h-4 animate-spin" />
            Cargando historial...
          </div>
        ) : registros.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-400 text-sm">
            Todavía no hay importaciones registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {registros.map((registro) => {
              const esActual = esSemanaActual(registro.fecha_importacion);

              return (
                <div
                  key={registro.id}
                  onClick={() =>
                    navigate("/reportes", {
                      state: { pedido: registro.numero_pedido },
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate("/reportes", {
                        state: { pedido: registro.numero_pedido },
                      });
                    }
                  }}
                  className={`rounded-2xl shadow-sm border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md cursor-pointer ${
                    esActual
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        esActual ? "bg-blue-100" : "bg-teal-50"
                      }`}
                    >
                      <FaFileExcel
                        className={`w-5 h-5 ${esActual ? "text-blue-600" : "text-teal-600"}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {esActual && (
                        <span className="px-2 py-1 rounded-md bg-blue-600 text-white text-[11px] font-medium whitespace-nowrap">
                          Esta semana
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200 whitespace-nowrap">
                        <FaHashtag className="w-3 h-3" />
                        Pedido: {registro.numero_pedido}
                      </span>
                    </div>
                  </div>

                  <p
                    className="text-sm font-semibold text-slate-800 break-words leading-snug"
                    title={registro.nombre_archivo}
                  >
                    {registro.nombre_archivo}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-slate-50">
                      <FaBoxOpen className="w-4 h-4 text-teal-600" />
                      <span className="text-lg font-bold text-slate-800">
                        {registro.cantidad_datos}
                      </span>
                      <span className="text-[11px] text-slate-400">datos</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-slate-50">
                      <FaCalendarAlt className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        {formatearFecha(registro.fecha_inicio)}
                      </span>
                      <span className="text-[11px] text-slate-400">inicio</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <FaClock className="w-3 h-3" />
                      Importado{" "}
                      {formatearFecha(registro.fecha_importacion, true)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(registro.id);
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Eliminar registro"
                      aria-label="Eliminar registro"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
