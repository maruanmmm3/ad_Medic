import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificamos que exista una sesión de recuperación válida.
  // Cuando el usuario llega desde el enlace del correo, Supabase
  // (con detectSessionInUrl activado, que es el default) procesa el
  // token del hash de la URL y crea una sesión automáticamente.
  const [sesionValida, setSesionValida] = useState(null); // null = verificando

  useEffect(() => {
    const verificarSesion = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        setSesionValida(false);
        return;
      }

      setSesionValida(true);
    };

    verificarSesion();

    // Por si el token tarda un instante en procesarse, también
    // escuchamos el evento PASSWORD_RECOVERY.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSesionValida(true);
        }
      },
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const actualizarPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Completa ambos campos",
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña muy corta",
        text: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Las contraseñas no coinciden",
        text: "Verifica que ambas contraseñas sean iguales",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar la contraseña",
        text: error.message,
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "¡Contraseña actualizada!",
      text: "Ya puedes iniciar sesión con tu nueva contraseña.",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      // Cerramos la sesión de recuperación para forzar un login limpio.
      supabase.auth.signOut();
      navigate("/login");
    });
  };

  // --- Estados de carga / enlace inválido ---

  if (sesionValida === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center">
          <p className="text-gray-500">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (sesionValida === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Enlace inválido o expirado
          </h1>

          <p className="text-gray-500 mb-6">
            Este enlace de recuperación ya no es válido. Solicita uno nuevo
            desde la pantalla de inicio de sesión.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
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
            Volver a inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // --- Formulario de nueva contraseña ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="https://yt3.googleusercontent.com/ytc/AIdro_kRH4uH9GTZGyp790ON-JYidM9c9Mm3SpO_s5hLvvQwhA=s900-c-k-c0x00ffffff-no-rj"
              alt="AD MEDIC"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="mt-4 text-3xl font-bold text-gray-800">
            Nueva contraseña
          </h1>

          <p className="text-gray-500 text-sm mt-1 text-center">
            Ingresa y confirma tu nueva contraseña
          </p>
        </div>

        <form onSubmit={actualizarPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>

            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 AD MEDIC · Equipos Médicos
          </p>
        </div>
      </div>
    </div>
  );
}
