import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const iniciarSesion = async (e) => {

    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({

      email,

      password

    });

    setLoading(false);

    if (error) {

      alert(error.message);

      return;

    }

    navigate("/home");

  };

  const registrar = async () => {

    if (!email || !password) {

      alert("Completa todos los campos");

      return;

    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({

      email,

      password

    });

    setLoading(false);

    if (error) {

      alert(error.message);

      return;

    }

    alert("Usuario registrado correctamente");

    console.log(data);

  };

  return (

    <div>

      <h1>Iniciar Sesión</h1>

      <form onSubmit={iniciarSesion}>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br /><br />

        <button type="submit" disabled={loading}>

          {loading ? "Cargando..." : "Ingresar"}

        </button>

        <button

          type="button"

          onClick={registrar}

          disabled={loading}

          style={{ marginLeft: "10px" }}

        >

          Registrarse

        </button>

      </form>

    </div>

  );

}