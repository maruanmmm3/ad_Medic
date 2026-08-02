import {
  FaUserMd,
  FaEnvelope,
  FaPhone,
  FaHospital,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";

import { supabase } from "../lib/supabase";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Opciones de foto de perfil disponibles para elegir (no se sube archivo, se selecciona una)
const OPCIONES_FOTO = [
  "https://cdn-icons-png.flaticon.com/512/3135/3135768.png",
  "https://i.pinimg.com/564x/9d/6b/9d/9d6b9db2dcb0526a09b89fb35d075c72.jpg",
];

export default function Perfil() {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const [editando, setEditando] = useState(false);
  const [perfilExiste, setPerfilExiste] = useState(null); // null = aún cargando
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  const [loading, setLoading] = useState(false);

  // Carga el perfil real desde Supabase (no solo lo que haya en localStorage)
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario) {
        setCargandoPerfil(false);
        return;
      }

      setEmail(usuario.email || "");

      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", usuario.id)
        .maybeSingle();

      if (error) {
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el perfil",
        });
        setCargandoPerfil(false);
        return;
      }

      if (data) {
        setNombre(data.nombre || "");
        setTelefono(data.telefono || "");
        setFotoUrl(data.foto_url || "");
        setPerfilExiste(true);
        setEditando(false);
      } else {
        // No existe perfil todavía: entramos directo en modo edición
        // para que el usuario complete sus datos y elija su foto.
        setNombre(usuario.nombre || "");
        setPerfilExiste(false);
        setEditando(true);
      }

      setCargandoPerfil(false);
    };

    cargarPerfil();
  }, []);

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Falta tu nombre",
        text: "Ingresa tu nombre para continuar",
      });
      return;
    }

    if (!fotoUrl) {
      Swal.fire({
        icon: "warning",
        title: "Elige una foto de perfil",
        text: "Selecciona una de las imágenes disponibles",
      });
      return;
    }

    try {
      setLoading(true);

      let data;
      let error;

      // Actualizar
      if (perfilExiste) {
        const respuesta = await supabase
          .from("perfiles")
          .update({ nombre, telefono, foto_url: fotoUrl })
          .eq("id", usuario.id)
          .select()
          .single();

        data = respuesta.data;
        error = respuesta.error;
      }
      // Insertar (generar perfil por primera vez)
      else {
        const respuesta = await supabase
          .from("perfiles")
          .insert({ id: usuario.id, nombre, telefono, foto_url: fotoUrl })
          .select()
          .single();

        data = respuesta.data;
        error = respuesta.error;
      }

      if (error) {
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo guardar el perfil",
        });
        return;
      }

      const usuarioActualizado = {
        ...usuario,
        nombre: data.nombre,
        telefono: data.telefono,
        foto_url: data.foto_url,
      };

      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      setPerfilExiste(true);
      setEditando(false);

      Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "Perfil guardado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Ocurrió un error",
        text: "Inténtalo nuevamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex justify-center items-center p-4 md:p-6">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}

        <div className="relative h-52 bg-gradient-to-r from-blue-700 to-cyan-500">
          <div className="absolute top-5 left-5 opacity-20 text-white text-8xl">
            ❤️
          </div>

          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserMd className="text-6xl text-blue-600" />
              )}
            </div>
          </div>
        </div>

        {/* Contenido */}

        <div className="pt-24 pb-10 px-5 md:px-8">
          {/* Botón regresar */}

          <div className="flex justify-start mb-6">
            <button
              onClick={() => navigate(-1)}
              className="
              flex
              items-center
              gap-2
              px-5
              py-3
              rounded-xl
              bg-white
              border
              border-slate-200
              text-slate-700
              hover:bg-slate-100
              shadow-sm
              transition
              active:scale-95
              "
            >
              <FaArrowLeft />

              <span>Regresar</span>
            </button>
          </div>

          {cargandoPerfil ? (
            <p className="text-center text-slate-500">Cargando perfil...</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center text-slate-800">
                {nombre || "Completa tu perfil"}
              </h1>

              <p className="text-center text-slate-500 mt-2">
                Sistema de Gestión de Equipos Médicos
              </p>

              {/* Selector de foto de perfil (solo visible en modo edición) */}
              {editando && (
                <div className="mt-8">
                  <p className="text-sm font-semibold text-slate-600 mb-3 text-center">
                    Elige tu foto de perfil
                  </p>

                  <div className="flex justify-center gap-4 flex-wrap">
                    {OPCIONES_FOTO.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setFotoUrl(url)}
                        className={`relative w-20 h-20 rounded-full overflow-hidden border-4 transition ${
                          fotoUrl === url
                            ? "border-blue-600 ring-4 ring-blue-200"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <img
                          src={url}
                          alt="Opción de foto"
                          className="w-full h-full object-cover"
                        />
                        {fotoUrl === url && (
                          <span className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full text-white text-xs p-1">
                            <FaCheckCircle />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                {/* Email */}

                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <FaEnvelope className="text-white" />
                    </div>

                    <div className="w-full">
                      <p className="text-sm text-slate-500 mb-2">
                        Correo electrónico
                      </p>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled
                        className="
                        w-full
                        p-2
                        rounded-lg
                        border
                        border-gray-300
                        disabled:bg-gray-100
                        disabled:text-gray-500
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Teléfono */}

                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-cyan-600 p-3 rounded-full">
                      <FaPhone className="text-white" />
                    </div>

                    <div className="w-full">
                      <p className="text-sm text-slate-500 mb-2">Teléfono</p>

                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        disabled={!editando}
                        className="
                        w-full
                        p-2
                        rounded-lg
                        border
                        border-gray-300
                        disabled:bg-gray-100
                        disabled:text-gray-500
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Nombre */}

                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-violet-600 p-3 rounded-full">
                      <FaUserMd className="text-white" />
                    </div>

                    <div className="w-full">
                      <p className="text-sm text-slate-500 mb-2">Nombre</p>

                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={!editando}
                        className="
                        w-full
                        p-2
                        rounded-lg
                        border
                        border-gray-300
                        disabled:bg-gray-100
                        disabled:text-gray-500
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Empresa */}

                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 p-3 rounded-full">
                      <FaHospital className="text-white" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Empresa</p>

                      <p className="font-semibold text-slate-800">AD MEDIC</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón */}

              <div className="flex justify-center mt-10">
                {!perfilExiste ? (
                  <button
                    onClick={guardarCambios}
                    disabled={loading}
                    className="
                        px-8
                        py-3
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        disabled:bg-gray-400
                        text-white
                        font-semibold
                        shadow-md
                        transition
                        "
                  >
                    {loading ? "Generando..." : "Generar Perfil"}
                  </button>
                ) : !editando ? (
                  <button
                    onClick={() => setEditando(true)}
                    className="
                        px-8
                        py-3
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-semibold
                        shadow-md
                        transition
                        "
                  >
                    Editar Perfil
                  </button>
                ) : (
                  <button
                    onClick={guardarCambios}
                    disabled={loading}
                    className="
                        px-8
                        py-3
                        rounded-xl
                        bg-green-600
                        hover:bg-green-700
                        disabled:bg-gray-400
                        text-white
                        font-semibold
                        shadow-md
                        transition
                        "
                  >
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
