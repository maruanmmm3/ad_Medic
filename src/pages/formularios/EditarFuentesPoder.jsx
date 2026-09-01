import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import EstadoCard from "../../components/EstadoCard";
import ImagenCategoria from "../../components/ImagenCategoria";
import Swal from "sweetalert2";

export default function EditarFuentespoder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [serie, setSerie] = useState("");
  const [lote, setLote] = useState("");

  const [recoleccion, setRecoleccion] = useState(false);
  const [reparacion, setReparacion] = useState(false);
  const [limpieza, setLimpieza] = useState(false);
  const [etiqueta, setEtiqueta] = useState(false);
  const [empaquetado, setEmpaquetado] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [categoriaCable, setCategoriaCable] = useState(""); // NUEVO

  const [fuenteOriginal, setFuenteOriginal] = useState(null); //Historial

  const [usuarioId, setUsuarioId] = useState(null);

  /* =========================
     OBTENER USUARIO (Supabase Auth)
  ========================== */
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

  /* =========================
     OBTENER FUENTE DE PODER
  ========================== */
  useEffect(() => {
    const obtenerData = async () => {
      const { data, error } = await supabase
        .from("fuentespoder")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setNombre(data.nombre ?? "");
      setNombreResponsable(data.nombre_responsable ?? "");
      setSerie(data.serie ?? "");
      setLote(data.lote ?? "");

      setRecoleccion(data.recoleccion || false);
      setReparacion(data.reparacion || false);
      setLimpieza(data.limpieza || false);
      setEtiqueta(data.etiqueta || false);
      setEmpaquetado(data.empaquetado || false);

      setCategoria(data.categoria_id ? String(data.categoria_id) : "");
      setCategoriaCable(data.categoria_cable ?? ""); // NUEVO
      setFuenteOriginal(data);
    };

    obtenerData();
  }, [id]);

  /* =========================
     OBTENER CATEGORÍAS
  ========================== */
  useEffect(() => {
    const obtenerCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, url_imagen")
        .eq("tipo", "FuentePoder")
        .order("nombre", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      setCategorias(data || []);
    };

    obtenerCategorias();
  }, []);

  /* =========================
         ACTUALIZAR
  ========================== */
  const actualizar = async () => {
    if (!usuarioId) {
      Swal.fire({
        icon: "error",
        title: "Sesión expirada",
        text: "Debes iniciar sesión nuevamente.",
      });
      return;
    }

    if (!serie.trim() || !categoria) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Serie y Categoría",
      });
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("fuentespoder")
      .update({
        nombre: nombre.trim() || null,
        nombre_responsable: nombreResponsable.trim() || null,
        serie,
        lote: lote.trim() || null,
        categoria_id: Number(categoria),
        categoria_cable: categoriaCable,

        recoleccion,
        reparacion,
        limpieza,
        etiqueta,
        empaquetado,
      })
      .eq("id", id);

    /* Historial */

    if (!error && fuenteOriginal) {
      const actividades = [];

      if (!fuenteOriginal.recoleccion && recoleccion) {
        actividades.push({
          tabla: "fuentespoder",
          registro_id: Number(id),
          actividad: "Recolección",
          usuario_id: usuarioId,
        });
      }

      if (!fuenteOriginal.reparacion && reparacion) {
        actividades.push({
          tabla: "fuentespoder",
          registro_id: Number(id),
          actividad: "Reparación",
          usuario_id: usuarioId,
        });
      }

      if (!fuenteOriginal.limpieza && limpieza) {
        actividades.push({
          tabla: "fuentespoder",
          registro_id: Number(id),
          actividad: "Limpieza",
          usuario_id: usuarioId,
        });
      }

      if (!fuenteOriginal.etiqueta && etiqueta) {
        actividades.push({
          tabla: "fuentespoder",
          registro_id: Number(id),
          actividad: "Etiqueta",
          usuario_id: usuarioId,
        });
      }

      if (!fuenteOriginal.empaquetado && empaquetado) {
        actividades.push({
          tabla: "fuentespoder",
          registro_id: Number(id),
          actividad: "Empaquetado",
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

    if (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });

      setGuardando(false);
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Actualizado",
      text: "Fuente de Poder actualizada correctamente",
    });

    setGuardando(false);
    navigate("/maquinas/fuentespoder");
  };

  /* =========================
          ELIMINAR
  ========================== */
  const eliminar = async () => {
    const res = await Swal.fire({
      title: "¿Eliminar Fuente de Poder?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
    });

    if (!res.isConfirmed) return;

    const { error } = await supabase.from("fuentespoder").delete().eq("id", id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminada",
      text: "Fuente de Poder eliminada correctamente",
    });

    navigate("/maquinas/fuentespoder");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/maquinas/fuentespoder")}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200"
          >
            <FaArrowLeft />
            Volver
          </button>

          <h1 className="text-3xl font-bold">Editar Fuente de Poder</h1>

          <div className="w-28"></div>
        </div>

        {/* INPUTS */}
        <div className="grid md:grid-cols-2 gap-5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre (opcional)"
            className="w-full border-2 rounded-2xl px-5 py-4"
          />

          <input
            value={nombreResponsable}
            onChange={(e) => setNombreResponsable(e.target.value)}
            placeholder="Responsable (opcional)"
            className="w-full border-2 rounded-2xl px-5 py-4"
          />

          <input
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            placeholder="Serie"
            className="w-full border-2 rounded-2xl px-5 py-4"
          />

          <input
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            placeholder="Lote (opcional)"
            className="w-full border-2 rounded-2xl px-5 py-4"
          />
        </div>

        {/* CATEGORÍA */}
        <div className="mt-5">
          <label className="font-semibold">Categoría</label>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border-2 rounded-2xl px-5 py-4 mt-2"
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <ImagenCategoria
            urlImagen={
              categorias.find((c) => String(c.id) === String(categoria))
                ?.url_imagen
            }
            nombre={
              categorias.find((c) => String(c.id) === String(categoria))
                ?.nombre
            }
          />
        </div>

        {/* CATEGORÍA DE CABLE - solo si hay categoría seleccionada */}
        {categoria && (
          <div className="mt-5">
            <label className="font-semibold">Categoría de Cable</label>

            <select
              value={categoriaCable}
              onChange={(e) => setCategoriaCable(e.target.value)}
              className="w-full border-2 rounded-2xl px-5 py-4 mt-2"
            >
              <option value="">Seleccione un tipo de cable</option>
              <option value="Cable Schuko(EU)">Cable Schuko(EU)</option>
              <option value="Cable Nema(US)">Cable Nema(US)</option>
            </select>
          </div>
        )}

        {/* ESTADOS */}
        <h2 className="text-xl font-semibold mt-10 mb-5">
          Estado del mantenimiento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <EstadoCard
            titulo="Recolección"
            activo={recoleccion}
            setActivo={setRecoleccion}
          />

          <EstadoCard
            titulo="Reparación"
            activo={reparacion}
            setActivo={setReparacion}
          />

          <EstadoCard
            titulo="Limpieza"
            activo={limpieza}
            setActivo={setLimpieza}
          />

          <EstadoCard
            titulo="Etiqueta"
            activo={etiqueta}
            setActivo={setEtiqueta}
          />

          <EstadoCard
            titulo="Empaquetado"
            activo={empaquetado}
            setActivo={setEmpaquetado}
          />
        </div>

        {/* BOTONES */}
        <div className="mt-10 flex justify-end gap-4">
          <button
            onClick={eliminar}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl"
          >
            <FaTrash /> Eliminar
          </button>

          <button
            onClick={actualizar}
            disabled={guardando}
            className="bg-cyan-600 text-white px-10 py-4 rounded-2xl"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
