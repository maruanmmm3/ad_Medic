import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import EstadoCard from "../../components/EstadoCard";
import Swal from "sweetalert2";

export default function EditarBateria() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [serieLote, setSerieLote] = useState("");

  const [mantenimiento, setMantenimiento] = useState(false);
  const [prueba, setPrueba] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");

  const [bateriaOriginal, setBateriaOriginal] = useState(null); //Historial

  /* Obtener batería */
  useEffect(() => {
    const obtenerBateria = async () => {
      const { data, error } = await supabase
        .from("baterias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setNombre(data.nombre);
      setSerieLote(data.serie_lote);
      setCategoria(data.categoria_id ?? "");

      setMantenimiento(data.mantenimiento);
      setPrueba(data.prueba);
      setBateriaOriginal(data); //Historial
    };

    obtenerBateria();
  }, [id]);

  /* Obtener categorías */
  useEffect(() => {
    const obtenerCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("tipo", "Bateria")
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
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    try {
      if (!nombre.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Ingrese el nombre de la batería",
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
        .from("baterias")
        .update({
          nombre,
          serie_lote: serieLote,
          categoria_id: categoria ? Number(categoria) : null,
          mantenimiento,
          prueba,
        })
        .eq("id", id);

      /* =========================
      HISTORIAL
========================= */

      if (!error && bateriaOriginal) {
        const actividades = [];

        if (!bateriaOriginal.mantenimiento && mantenimiento) {
          actividades.push({
            tabla: "baterias",
            registro_id: Number(id),
            actividad: "Mantenimiento",
            usuario_id: usuario.id,
          });
        }

        if (!bateriaOriginal.prueba && prueba) {
          actividades.push({
            tabla: "baterias",
            registro_id: Number(id),
            actividad: "Prueba",
            usuario_id: usuario.id,
          });
        }

        if (actividades.length > 0) {
          const { error: historialError } = await supabase
            .from("historial_actividades")
            .insert(actividades);

          if (historialError) {
            console.log("Error historial:", historialError);
          }
        }
      }

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
        title: "Actualizada",
        text: "Batería actualizada correctamente",
        confirmButtonColor: "#0891b2",
      });

      navigate("/maquinas/baterias");
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
      title: "¿Eliminar batería?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) return;

    const { error } = await supabase.from("baterias").delete().eq("id", id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la batería",
      });

      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminada",
      text: "La batería fue eliminada correctamente",
      confirmButtonColor: "#0891b2",
    });

    navigate("/maquinas/baterias");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/maquinas/baterias")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-md transition-all hover:scale-105"
          >
            <FaArrowLeft />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-slate-800">Editar Batería</h1>

          <div className="w-28"></div>
        </div>

        {/* DATOS */}
        <div className="space-y-5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          <input
            value={serieLote}
            onChange={(e) => setSerieLote(e.target.value)}
            placeholder="Serie / Lote"
            className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />
        </div>

        {/* CATEGORIA */}
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

        {/* ESTADOS */}
        <h2 className="text-xl font-semibold text-slate-700 mt-10 mb-5">
          Estado del proceso
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <EstadoCard
            titulo="Mantenimiento"
            activo={mantenimiento}
            setActivo={setMantenimiento}
          />

          <EstadoCard titulo="Prueba" activo={prueba} setActivo={setPrueba} />
        </div>

        {/* BOTONES */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={eliminar}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all"
          >
            <FaTrash />
            Eliminar
          </button>

          <button
            onClick={actualizar}
            disabled={guardando}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white font-semibold px-10 py-4 rounded-2xl shadow-lg transition-all"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
