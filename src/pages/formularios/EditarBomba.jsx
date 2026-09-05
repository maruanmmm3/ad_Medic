import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import EstadoCard from "../../components/EstadoCard";
import ImagenCategoria from "../../components/ImagenCategoria";
import Swal from "sweetalert2";

// Categorías que tienen una versión "cortada" especial para Space Plus
const CATEGORIAS_CON_VERSION_SPACE_PLUS = ["Infusora", "Perfusora"];

// Si la máquina es "Space Plus" y la categoría es Infusora/Perfusora,
// le agrega un "_" justo antes de la extensión del archivo para que
// apunte a la imagen "cortada" correspondiente (ej: CORTADA_ISP.png -> CORTADA_ISP_.png)
function obtenerImagenCategoria(nombreResponsable, categoriaSeleccionada) {
  if (!categoriaSeleccionada) return undefined;

  const { nombre, url_imagen } = categoriaSeleccionada;

  const aplicaVersionSpacePlus =
    nombreResponsable === "Space Plus" &&
    CATEGORIAS_CON_VERSION_SPACE_PLUS.includes(nombre) &&
    !!url_imagen;

  if (!aplicaVersionSpacePlus) return url_imagen;

  const ultimoPunto = url_imagen.lastIndexOf(".");

  if (ultimoPunto === -1) return `${url_imagen}_`;

  return `${url_imagen.slice(0, ultimoPunto)}_${url_imagen.slice(ultimoPunto)}`;
}

export default function EditarBomba() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [serie, setSerie] = useState("");
  const [lote, setLote] = useState("");
  const [recoleccion, setRecoleccion] = useState(false);
  const [limpieza, setLimpieza] = useState(false);
  const [pruebaCan, setPruebaCan] = useState(false);
  const [reparacion, setReparacion] = useState(false);
  const [actualizacion, setActualizacion] = useState(false);
  const [tsc, setTsc] = useState(false);
  const [empaque, setEmpaque] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");

  const [bombaOriginal, setBombaOriginal] = useState(null); //Historial

  const [usuarioId, setUsuarioId] = useState(null);

  /* Obtener el usuario logueado con Supabase Auth (para el historial) */
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text: "Debes iniciar sesión nuevamente.",
        }).then(() => {
          navigate("/");
        });
        return;
      }

      setUsuarioId(data.session.user.id);
    };

    obtenerUsuario();
  }, [navigate]);

  /* Obtener Bomba de la BD */
  useEffect(() => {
    const obtenerBomba = async () => {
      const { data, error } = await supabase
        .from("bombas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setNombre(data.nombre);
      setSerie(data.serie);
      setLote(data.lote);
      setCategoria(data.categoria_id);
      setRecoleccion(data.recoleccion);
      setLimpieza(data.limpieza);
      setPruebaCan(data.prueba_can);
      setReparacion(data.reparacion);
      setActualizacion(data.actualizacion);
      setTsc(data.tsc);
      setEmpaque(data.empaque);
      // Guardamos la máquina original
      setBombaOriginal(data);
    };

    obtenerBomba();
  }, [id]);

  /* Obtener Categorias de la BD */
  useEffect(() => {
    const obtenerCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, url_imagen")
        .eq("tipo", "Bomba")
        .order("nombre", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      setCategorias(data);
    };

    obtenerCategorias();
  }, []);

  const actualizar = async () => {
    if (!usuarioId) {
      Swal.fire({
        icon: "error",
        title: "Sesión expirada",
        text: "Debes iniciar sesión nuevamente.",
      });
      return;
    }

    try {
      if (!nombre.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Ingrese el nombre de la máquina",
        });

        return;
      }

      if (!serie.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Ingrese la serie",
        });

        return;
      }

      setGuardando(true);

      const { error } = await supabase
        .from("bombas")
        .update({
          nombre,
          serie,
          lote,
          categoria_id: categoria,
          recoleccion,
          limpieza,
          prueba_can: pruebaCan,
          reparacion,
          actualizacion,
          tsc,
          empaque,
        })
        .eq("id", id);

      // Guardar el historial
      if (!error && bombaOriginal) {
        const actividades = [];

        if (!bombaOriginal.recoleccion && recoleccion) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Recolección",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.limpieza && limpieza) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Limpieza",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.prueba_can && pruebaCan) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Prueba CAN",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.reparacion && reparacion) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Reparación",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.actualizacion && actualizacion) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Actualización",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.tsc && tsc) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "TSC",
            usuario_id: usuarioId,
          });
        }

        if (!bombaOriginal.empaque && empaque) {
          actividades.push({
            tabla: "bombas",
            registro_id: id,
            actividad: "Empaque",
            usuario_id: usuarioId,
          });
        }

        if (actividades.length > 0) {
          const { error: historialError } = await supabase
            .from("historial_actividades")
            .insert(actividades);

          if (historialError) {
            console.log(historialError);
          }
        }
      }
      // Fin Guardar el historial

      if (error) {
        console.log(error);

        Swal.fire({
          icon: "error",

          title: "Error",

          text: error.message,
        });

        return;
      }

      await Swal.fire({
        icon: "success",

        title: "Actualizado",

        text: "Máquina actualizada correctamente",

        confirmButtonColor: "#0891b2",
      });

      navigate("/maquinas/bombas");
    } catch (err) {
      console.log(err);

      Swal.fire({
        icon: "error",

        title: "Error inesperado",

        text: "Ocurrió un error al actualizar",
      });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    const resultado = await Swal.fire({
      title: "¿Eliminar máquina?",

      text: "Esta acción no se puede deshacer.",

      icon: "warning",

      showCancelButton: true,

      confirmButtonColor: "#dc2626",

      cancelButtonColor: "#64748b",

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) return;

    const { error } = await supabase

      .from("bombas")

      .delete()

      .eq("id", id);

    if (error) {
      Swal.fire({
        icon: "error",

        title: "Error",

        text: "No se pudo eliminar la máquina",
      });

      return;
    }

    await Swal.fire({
      icon: "success",

      title: "Eliminada",

      text: "La máquina fue eliminada correctamente",

      confirmButtonColor: "#0891b2",
    });

    navigate("/maquinas/bombas");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/maquinas/bombas")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-md transition-all hover:scale-105"
          >
            <FaArrowLeft />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-slate-800">Editar Bomba</h1>

          {/* Espacio para equilibrar el diseño */}

          <div className="w-28"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="
        w-full
        border-2
        border-slate-200
        rounded-2xl
        px-5
        py-4
        text-lg
        outline-none
        focus:border-cyan-500
        transition-all
        "
          />

          <input
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            placeholder="Serie"
            className="
        w-full
        border-2
        border-slate-200
        rounded-2xl
        px-5
        py-4
        text-lg
        outline-none
        focus:border-cyan-500
        transition-all
        "
          />

          <input
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            placeholder="Lote"
            className="
        w-full
        border-2
        border-slate-200
        rounded-2xl
        px-5
        py-4
        text-lg
        outline-none
        focus:border-cyan-500
        transition-all
        "
          />
        </div>

        {/* CATEGORÍA */}
        <div className="mt-5">
          <label className="block text-slate-700 font-semibold mb-2">
            Categoría
          </label>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
          >
            <option value="">Seleccione una categoría</option>

            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <ImagenCategoria
            urlImagen={obtenerImagenCategoria(
              nombre,
              categorias.find((c) => String(c.id) === String(categoria)),
            )}
            nombre={
              categorias.find((c) => String(c.id) === String(categoria))
                ?.nombre
            }
          />
        </div>

        <h2 className="text-xl font-semibold text-slate-700 mt-10 mb-5">
          Estado del mantenimiento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <EstadoCard
            titulo="Recolección"
            activo={recoleccion}
            setActivo={setRecoleccion}
          />

          <EstadoCard
            titulo="Limpieza"
            activo={limpieza}
            setActivo={setLimpieza}
          />

          <EstadoCard
            titulo="Prueba CAN"
            activo={pruebaCan}
            setActivo={setPruebaCan}
          />

          <EstadoCard
            titulo="Reparación"
            activo={reparacion}
            setActivo={setReparacion}
          />

          <EstadoCard
            titulo="Actualización"
            activo={actualizacion}
            setActivo={setActualizacion}
          />

          <EstadoCard titulo="TSC" activo={tsc} setActivo={setTsc} />

          <EstadoCard
            titulo="Empaque"
            activo={empaque}
            setActivo={setEmpaque}
          />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
          {/* Eliminar */}
          <button
            onClick={eliminar}
            className="

    w-full

    sm:w-auto

    flex

    items-center

    justify-center

    gap-3

    bg-red-600

    hover:bg-red-700

    text-white

    font-semibold

    px-8

    py-4

    rounded-2xl

    shadow-lg

    transition-all

    hover:scale-105

    "
          >
            <FaTrash />
            Eliminar
          </button>

          {/* Guardar cambios */}
          <button
            onClick={actualizar}
            disabled={guardando}
            className="

    w-full

    sm:w-auto

    bg-cyan-600

    hover:bg-cyan-700

    disabled:bg-slate-400

    text-white

    font-semibold

    px-10

    py-4

    rounded-2xl

    shadow-lg

    transition-all

    hover:scale-105

    "
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
