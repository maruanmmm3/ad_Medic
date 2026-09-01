import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(""); // solo se usa al registrarse
  const [usuario, setUsuario] = useState(""); // nombre_usuario, usado para login y registro
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);

  // --- Olvidé mi contraseña ---
  const [esOlvidoPassword, setEsOlvidoPassword] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const [loadingRecuperacion, setLoadingRecuperacion] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    if (!usuario || !password) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);

    // 1. Buscamos el email asociado a ese nombre_usuario mediante la función RPC
    const { data: emailEncontrado, error: errorBusqueda } = await supabase.rpc(
      "get_email_by_username",
      { p_nombre_usuario: usuario },
    );

    if (errorBusqueda || !emailEncontrado) {
      setLoading(false);
      alert("Usuario o contraseña incorrectos");
      return;
    }

    // 2. Iniciamos sesión con ese email + la contraseña ingresada
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailEncontrado,
      password,
    });

    setLoading(false);

    if (error) {
      alert("Usuario o contraseña incorrectos");
      return;
    }

    // Supabase ya guarda la sesión sola (localStorage/cookies internos).
    navigate("/home");
  };

  const recuperarPassword = async (e) => {
    e.preventDefault();

    if (!emailRecuperacion) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Ingresa tu correo electrónico",
      });
      return;
    }

    setLoadingRecuperacion(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      emailRecuperacion,
      {
        // Ruta a la que Supabase redirige al usuario tras hacer clic
        // en el enlace del correo. Debe existir en tu app y estar
        // registrada en Supabase (Authentication > URL Configuration).
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    setLoadingRecuperacion(false);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo enviar el correo",
        text: error.message,
      });
      return;
    }

    // Por seguridad, Supabase no indica si el correo existe o no,
    // así que siempre mostramos el mismo mensaje de éxito.
    Swal.fire({
      icon: "success",
      title: "Revisa tu correo",
      text: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.",
      confirmButtonColor: "#3085d6",
    });

    setEmailRecuperacion("");
    setEsOlvidoPassword(false);
  };

  const registrar = async (e) => {
    e.preventDefault();

    if (!nombre || !usuario || !email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Completa todos los campos",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre, // esto llega a raw_user_meta_data, que usa el trigger
          nombre_usuario: usuario,
        },
      },
    });

    setLoading(false);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: error.message,
      });
      return;
    }

    // Si tienes confirmación de email activada en Supabase, el usuario
    // debe confirmar su correo antes de poder iniciar sesión.
    Swal.fire({
      icon: "success",
      title: "¡Registro exitoso!",
      text: "Usuario registrado correctamente. Revisa tu correo si se requiere confirmación.",
      confirmButtonColor: "#3085d6",
    });

    setNombre("");
    setUsuario("");
    setEmail("");
    setPassword("");
    setEsRegistro(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="https://yt3.googleusercontent.com/ytc/AIdro_kRH4uH9GTZGyp790ON-JYidM9c9Mm3SpO_s5hLvvQwhA=s900-c-k-c0x00ffffff-no-rj"
              alt="AD MEDIC"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="mt-4 text-3xl font-bold text-gray-800">AD MEDIC</h1>

          <p className="text-gray-500 text-sm mt-1">
            Sistema de Gestión de Equipos Médicos
          </p>
        </div>

        {esOlvidoPassword ? (
          <form onSubmit={recuperarPassword} className="space-y-5">
            <p className="text-sm text-gray-500 text-center">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>

              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={emailRecuperacion}
                onChange={(e) => setEmailRecuperacion(e.target.value)}
                className="
              w-full
              px-4
              py-3
              border
              border-gray-300
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition
            "
              />
            </div>

            <button
              type="submit"
              disabled={loadingRecuperacion}
              className="
      w-full
      bg-blue-600
      hover:bg-blue-700
      text-white
      py-3
      rounded-xl
      font-semibold
      shadow-lg
      transition
    "
            >
              {loadingRecuperacion ? "Enviando..." : "Enviar enlace"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEsOlvidoPassword(false);
                setEmailRecuperacion("");
              }}
              className="w-full text-center text-blue-600 hover:underline text-sm"
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <form
            onSubmit={esRegistro ? registrar : iniciarSesion}
            className="space-y-5"
          >
            {esRegistro && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>

                <input
                  type="text"
                  placeholder="Ingresa tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="
          w-full
          px-4
          py-3
          rounded-xl
          border
          border-gray-300
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          transition
        "
                />
              </div>
            )}

            {/* Usuario (siempre visible: se usa para registro y para login) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>

              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="
              w-full
              px-4
              py-3
              border
              border-gray-300
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition
            "
              />
            </div>

            {/* Correo (solo al registrarse) */}
            {esRegistro && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
              w-full
              px-4
              py-3
              border
              border-gray-300
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition
            "
                />
              </div>
            )}

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>

              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
              w-full
              px-4
              py-3
              border
              border-gray-300
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              transition
            "
              />
            </div>

            {/* Olvidé mi contraseña (solo visible en modo login) */}
            {!esRegistro && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => setEsOlvidoPassword(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Botón ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="
      w-full
      bg-blue-600
      hover:bg-blue-700
      text-white
      py-3
      rounded-xl
      font-semibold
      shadow-lg
      transition
    "
            >
              {loading
                ? esRegistro
                  ? "Creando cuenta..."
                  : "Ingresando..."
                : esRegistro
                  ? "Crear cuenta"
                  : "Ingresar"}
            </button>
          </form>
        )}

        {/* Pie */}
        {!esOlvidoPassword && (
          <div className="text-center mt-5">
            {esRegistro ? (
              <button
                type="button"
                onClick={() => setEsRegistro(false)}
                className="text-blue-600 hover:underline"
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEsRegistro(true)}
                className="text-blue-600 hover:underline"
              >
                ¿No tienes cuenta? Regístrate
              </button>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 AD MEDIC · Equipos Médicos
          </p>
        </div>
      </div>
    </div>
  );
}
