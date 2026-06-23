import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import EstadoCard from "../../components/EstadoCard";
import Swal from "sweetalert2";

export default function EditarMaquina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [serieLote, setSerieLote] = useState("");
  const [recoleccion, setRecoleccion] = useState(false);
  const [limpieza, setLimpieza] = useState(false);
  const [pruebaCan, setPruebaCan] = useState(false);
  const [reparacion, setReparacion] = useState(false);
  const [actualizacion, setActualizacion] = useState(false);
  const [tsc, setTsc] = useState(false);
  const [empaque, setEmpaque] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");

  /* Obtener Maquina de la BD */
  useEffect(() => {
    const obtenerMaquina = async () => {
      const { data, error } = await supabase
        .from("maquinas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setNombre(data.nombre);
      setSerieLote(data.serie_lote);
      setCategoria(data.categoria_id);
      setRecoleccion(data.recoleccion);
      setLimpieza(data.limpieza);
      setPruebaCan(data.prueba_can);
      setReparacion(data.reparacion);
      setActualizacion(data.actualizacion);
      setTsc(data.tsc);
      setEmpaque(data.empaque);
    };

    obtenerMaquina();
  }, [id]);

  /* Obtener Categorias de la BD */
  useEffect(() => {
    const obtenerCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
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
    try {
      if (!nombre.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Ingrese el nombre de la máquina",
        });

        return;
      }

      if (!serieLote.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Ingrese la serie o lote",
        });

        return;
      }

      setGuardando(true);

      const { error } = await supabase
        .from("maquinas")
        .update({
          nombre,
          serie_lote: serieLote,
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

      navigate("/maquinas");
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

      .from("maquinas")

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

    navigate("/maquinas");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/maquinas")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-md transition-all hover:scale-105"
          >
            <FaArrowLeft />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-slate-800">Editar Máquina</h1>

          {/* Espacio para equilibrar el diseño */}

          <div className="w-28"></div>
        </div>

        <div className="space-y-5">
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
            value={serieLote}
            onChange={(e) => setSerieLote(e.target.value)}
            placeholder="Serie / Lote"
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
