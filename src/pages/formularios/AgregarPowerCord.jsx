import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { FaPlug, FaArrowLeft, FaSave, FaBarcode } from "react-icons/fa";
import Swal from "sweetalert2";
import ImagenCategoria from "../../components/ImagenCategoria";

export default function AgregarPowerCord() {
  const navigate = useNavigate();

  const [nombreResponsable, setNombreResponsable] = useState("");
  const [lote, setLote] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [guardando, setGuardando] = useState(false);

  const obtenerCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, url_imagen")
      .eq("tipo", "PowerCord")
      .order("nombre", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setCategorias(data || []);
  };

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const guardar = async () => {
    if (!nombreResponsable.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Debes completar todos los campos",
        confirmButtonColor: "#0891b2",
      });

      return;
    }

    setGuardando(true);

    const { error } = await supabase.from("powercord").insert([
      {
        nombre_responsable: nombreResponsable.trim(),
        lote: lote.trim() || null,
        categoria_id: categoria || null,
        fecha: new Date().toISOString(),
        limpieza: false,
        prueba: false,
        empaque: false,
      },
    ]);

    setGuardando(false);

    if (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar el PowerCord",
      });

      return;
    }

    Swal.fire({
      icon: "success",
      title: "🔌 PowerCord registrado",
      text: "Se guardó correctamente",
      timer: 2000,
      showConfirmButton: false,
    });

    navigate("/maquinas/powercord", {
      state: {
        mensaje: "PowerCord registrado correctamente",
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-100 to-cyan-100 p-4 md:p-8">
      {/* ENCABEZADO */}

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-600 p-4 rounded-2xl shadow-lg">
              <FaPlug className="text-white text-3xl" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Registrar PowerCord
              </h1>

              <p className="text-slate-500">
                Agrega un nuevo equipo al sistema
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/maquinas/powercord")}
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

            <p className="text-cyan-100 mt-1">Complete los datos del equipo</p>
          </div>

          {/* CONTENIDO */}

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* RESPONSABLE */}

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Responsable
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={nombreResponsable}
                    onChange={(e) => setNombreResponsable(e.target.value)}
                    placeholder="Nombre del responsable"
                    className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition"
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
                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* CATEGORÍA */}
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
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

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
            </div>

            {/* ESTADO */}
            <div className="mt-10">
              <h3 className="text-xl font-bold text-slate-800 mb-5">
                Estado Inicial
              </h3>

              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-6">
                <p className="text-slate-600">
                  Todos los procesos serán registrados inicialmente como:
                </p>

                <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                  ● Pendiente
                </div>
              </div>
            </div>

            {/* BOTONES */}

            <div className="flex justify-end gap-4 mt-10">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>

              <button
                onClick={guardar}
                disabled={guardando}
                className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl shadow-lg transition"
              >
                <FaSave />
                {guardando ? "Guardando..." : "Guardar PowerCord"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
