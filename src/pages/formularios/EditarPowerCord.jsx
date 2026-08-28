import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import EstadoCard from "../../components/EstadoCard";
import Swal from "sweetalert2";

export default function EditarPowerCord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  const [nombreResponsable, setNombreResponsable] = useState("");
  const [lote, setLote] = useState("");
  const [limpieza, setLimpieza] = useState(false);
  const [prueba, setPrueba] = useState(false);
  const [empaque, setEmpaque] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");

  /* Obtener PowerCord de la BD */
  useEffect(() => {
    const obtenerPowerCord = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("powercord")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el registro.",
        }).then(() => navigate("/maquinas/powercord"));
        return;
      }

      setNombreResponsable(data.nombre_responsable);
      setLote(data.lote);
      setCategoria(data.categoria_id);
      setLimpieza(data.limpieza);
      setPrueba(data.prueba);
      setEmpaque(data.empaque);

      setLoading(false);
    };

    obtenerPowerCord();
  }, [id, navigate]);

  /* Obtener Categorias de la BD */
  useEffect(() => {
    const obtenerCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("tipo", "PowerCord")
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
    if (!nombreResponsable.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Ingrese el nombre del responsable",
      });

      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("powercord")
      .update({
        nombre_responsable: nombreResponsable,
        lote,
        categoria_id: categoria,
        limpieza,
        prueba,
        empaque,
      })
      .eq("id", id);

    setGuardando(false);

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
      text: "PowerCord actualizado correctamente",
      confirmButtonColor: "#0891b2",
    });

    navigate("/maquinas/powercord");
  };

  const eliminar = async () => {
    const resultado = await Swal.fire({
      title: "¿Eliminar registro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) return;

    const { error } = await supabase.from("powercord").delete().eq("id", id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el registro",
      });

      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "El registro fue eliminado correctamente",
      confirmButtonColor: "#0891b2",
    });

    navigate("/maquinas/powercord");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/maquinas/powercord")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-md transition-all hover:scale-105"
          >
            <FaArrowLeft />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-slate-800">
            Editar PowerCord
          </h1>

          {/* Espacio para equilibrar el diseño */}
          <div className="w-28"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <input
            value={nombreResponsable}
            onChange={(e) => setNombreResponsable(e.target.value)}
            placeholder="Responsable"
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
        </div>

        <h2 className="text-xl font-semibold text-slate-700 mt-10 mb-5">
          Estado del mantenimiento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <EstadoCard
            titulo="Limpieza"
            activo={limpieza}
            setActivo={setLimpieza}
          />

          <EstadoCard titulo="Prueba" activo={prueba} setActivo={setPrueba} />

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
