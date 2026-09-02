import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Swal from "sweetalert2";
import {
  FaWarehouse,
  FaArrowLeft,
  FaSave,
  FaBarcode,
  FaTrash,
} from "react-icons/fa";

const nombresDisponibles = [
  "Space",
  "Space Plus",
  "Compact Plus",
  "Enteroport",
];
const estadosDisponibles = ["Operativa", "Inoperativa"];

// Nombres para los cuales la categoría se oculta dinámicamente
const NOMBRES_SIN_CATEGORIA = ["Compact Plus", "Enteroport"];

export default function EditarAlmacenado() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nombre, setNombre] = useState("");
  const [serie, setSerie] = useState("");
  const [lote, setLote] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [nota, setNota] = useState("");

  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const mostrarCategoria = !NOMBRES_SIN_CATEGORIA.includes(nombre);
  const notaHabilitada = estado === "Inoperativa";

  /* Obtener datos del usuario logueado con Supabase Auth */
  useEffect(() => {
    const verificarSesion = async () => {
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
      setVerificandoSesion(false);
    };

    verificarSesion();
  }, [navigate]);
  /* Fin obtener datos del usuario */

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

  const obtenerAlmacenado = async () => {
    const { data, error } = await supabase
      .from("almacenados")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el equipo",
      }).then(() => {
        navigate("/maquinas/almacenados");
      });
      return;
    }

    setNombre(data.nombre ?? "");
    setSerie(data.serie ?? "");
    setLote(data.lote ?? "");
    setCategoria(data.categoria_id ? String(data.categoria_id) : "");
    setEstado(data.estado ?? "");
    setNota(data.nota ?? "");
    setCargando(false);
  };

  useEffect(() => {
    obtenerCategorias();
    obtenerAlmacenado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleNombreChange = (e) => {
    const nuevoNombre = e.target.value;
    setNombre(nuevoNombre);

    // Si el nuevo nombre oculta la categoría, se limpia su valor
    if (NOMBRES_SIN_CATEGORIA.includes(nuevoNombre)) {
      setCategoria("");
    }
  };

  const handleEstadoChange = (e) => {
    const nuevoEstado = e.target.value;
    setEstado(nuevoEstado);

    // Si el estado deja de ser Inoperativa, se limpia la nota
    if (nuevoEstado !== "Inoperativa") {
      setNota("");
    }
  };

  const actualizar = async () => {
    if (!nombre || !estado || !serie.trim() || !lote.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Debes completar Nombre, Serie, Lote y Estado",
        confirmButtonColor: "#0891b2",
      });

      return;
    }

    if (mostrarCategoria && !categoria) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Debes seleccionar una categoría",
        confirmButtonColor: "#0891b2",
      });

      return;
    }

    if (!usuarioId) {
      Swal.fire({
        icon: "error",
        title: "Sesión expirada",
        text: "Debes iniciar sesión nuevamente.",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("almacenados")
      .update({
        nombre,
        serie,
        lote,
        categoria_id: mostrarCategoria ? Number(categoria) : null,
        estado,
        nota: notaHabilitada ? nota.trim() || null : null,
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });

      return;
    }

    Swal.fire({
      icon: "success",
      title: "📦 Equipo actualizado",
      text: "Se guardó correctamente",
      timer: 2000,
      showConfirmButton: false,
    });

    navigate("/maquinas/almacenados", {
      state: {
        mensaje: "Equipo actualizado correctamente",
      },
    });
  };

  const eliminar = async () => {
    const resultado = await Swal.fire({
      title: "¿Eliminar equipo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!resultado.isConfirmed) return;

    const { error } = await supabase.from("almacenados").delete().eq("id", id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el equipo",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "El equipo fue eliminado correctamente",
      confirmButtonColor: "#0891b2",
    });

    navigate("/maquinas/almacenados");
  };

  if (verificandoSesion || cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-100 to-cyan-100 p-4 md:p-8">
      {/* ENCABEZADO */}

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">
              <FaWarehouse className="text-white text-3xl" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Editar Almacenado
              </h1>

              <p className="text-slate-500">
                Modifica los datos del equipo almacenado
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/maquinas/almacenados")}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg transition"
          >
            <FaArrowLeft />
            Volver
          </button>
        </div>
      </div>

      {/* FORMULARIO */}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* CABECERA */}

          <div className="bg-cyan-600 p-6">
            <h2 className="text-white text-2xl font-bold">
              Información General
            </h2>

            <p className="text-cyan-100 mt-1">
              Actualiza los datos del equipo almacenado
            </p>
          </div>

          {/* CONTENIDO */}

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* NOMBRE */}

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Nombre
                </label>

                <div className="relative">
                  <select
                    value={nombre}
                    onChange={handleNombreChange}
                    className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
                  >
                    <option value="">Seleccione un nombre</option>
                    {nombresDisponibles.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SERIE */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Serie
                </label>

                <div className="relative">
                  <FaBarcode className="absolute left-4 top-5 text-cyan-600" />

                  <input
                    type="text"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    placeholder="Ej: SER-2026-001"
                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
                  />
                </div>
              </div>

              {/* LOTE */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Lote
                </label>

                <div className="relative">
                  <FaBarcode className="absolute left-4 top-5 text-cyan-600" />

                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="Ej: LOT-2026-001"
                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
                  />
                </div>
              </div>

              {/* CATEGORÍA - se oculta dinámicamente */}
              {mostrarCategoria && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">
                    Categoría
                  </label>

                  <div className="relative">
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
                    >
                      <option value="">Seleccione una categoría</option>

                      {categorias.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ESTADO */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Estado
                </label>

                <div className="relative">
                  <select
                    value={estado}
                    onChange={handleEstadoChange}
                    className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition bg-white"
                  >
                    <option value="">Seleccione un estado</option>
                    {estadosDisponibles.map((es) => (
                      <option key={es} value={es}>
                        {es}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NOTA - solo habilitada si Estado es Inoperativa */}
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-2">
                  Nota
                </label>

                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  disabled={!notaHabilitada}
                  rows={5}
                  placeholder={
                    notaHabilitada
                      ? "Escribe el detalle de la falla o motivo..."
                      : "Solo disponible cuando el Estado es Inoperativa"
                  }
                  className={`w-full border-2 rounded-2xl px-5 py-4 outline-none transition resize-none
                    ${
                      notaHabilitada
                        ? "border-slate-200 bg-white focus:border-cyan-500"
                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                />
              </div>
            </div>

            {/* BOTONES */}

            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10">
              <button
                onClick={eliminar}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-lg transition"
              >
                <FaTrash />
                Eliminar
              </button>

              <button
                onClick={() => navigate("/maquinas/almacenados")}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>

              <button
                onClick={actualizar}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl shadow-lg transition"
              >
                <FaSave />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
