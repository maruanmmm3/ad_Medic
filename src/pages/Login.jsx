import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");

  const [esRegistro, setEsRegistro] = useState(false);

  const iniciarSesion = async (e) => {

    e.preventDefault();

    setLoading(true);

    const { data, error } = await supabase

      .from("usuarios")

      .select("*")

      .eq("email", email)

      .eq("password", password)

      .single();

    setLoading(false);

    if (error || !data) {

      alert("Correo o contraseña incorrectos");

      return;

    }

    // Guardar sesión localmente
    localStorage.setItem("usuario", JSON.stringify(data));

    navigate("/home");

  };

  const registrar = async () => {

  if (!nombre || !email || !password) {

    alert("Completa todos los campos");

    return;

  }

  setLoading(true);

  const { error } = await supabase

    .from("usuarios")

    .insert([
      {
        nombre,
        email,
        password
      }
    ]);

  setLoading(false);

  if (error) {

    alert(error.message);

    return;

  }

  alert("Usuario registrado correctamente");

  setNombre("");

  setEmail("");

  setPassword("");

  setEsRegistro(false);

};

 return (

  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center px-4">

    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">

      {/* Logo */}

      <div className="flex flex-col items-center mb-8">

        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl shadow-lg">

          +

        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-800">

          AD MEDIC

        </h1>

        <p className="text-gray-500 text-sm mt-1">

          Sistema de Gestión de Equipos Médicos

        </p>

      </div>


      <form onSubmit={iniciarSesion} className="space-y-5">

        {
  esRegistro && (

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

  )
}

        {/* Correo */}

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


        {/* Botón ingresar */}

        {
  esRegistro ?

  <button

    type="button"

    onClick={registrar}

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

    {

      loading

      ? "Creando cuenta..."

      : "Crear cuenta"

    }

  </button>

  :

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

    {

      loading

      ? "Ingresando..."

      : "Ingresar"

    }

  </button>

  

}

      </form>


      {/* Pie */}


        <div className="text-center mt-5">

  {

    esRegistro ?

    <button

      type="button"

      onClick={() => setEsRegistro(false)}

      className="text-blue-600 hover:underline"

    >

      ¿Ya tienes una cuenta? Inicia sesión

    </button>

    :

    <button

      type="button"

      onClick={() => setEsRegistro(true)}

      className="text-blue-600 hover:underline"

    >

      ¿No tienes cuenta? Regístrate

    </button>

  }

</div>

      <div className="mt-8 text-center">

        <p className="text-xs text-gray-400">

          © 2026 AD MEDIC · Equipos Médicos

        </p>

      </div>

    </div>

  </div>

);
}