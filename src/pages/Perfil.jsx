import {
  FaUserMd,
  FaEnvelope,
  FaPhone,
  FaHospital,
  FaArrowLeft
} from "react-icons/fa";

import { supabase } from "../lib/supabase";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Perfil() {

  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [editando, setEditando] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (usuario) {

      setNombre(usuario.nombre || "");
      setTelefono(usuario.telefono || "");
      setEmail(usuario.email || "");

    }

  }, []);

  const guardarCambios = async () => {

    try {

      setLoading(true);

      const { data: perfilExistente, error: errorBusqueda } = await supabase

        .from("perfiles")

        .select("*")

        .eq("id", usuario.id)

        .maybeSingle();


      if (errorBusqueda) {

        console.log(errorBusqueda);

        alert("Error al buscar el perfil");

        return;

      }

      let data;
      let error;

      // Actualizar

      if (perfilExistente) {

        const respuesta = await supabase

          .from("perfiles")

          .update({

            nombre,

            telefono

          })

          .eq("id", usuario.id)

          .select()

          .single();

        data = respuesta.data;
        error = respuesta.error;

      }

      // Insertar

      else {

        const respuesta = await supabase

          .from("perfiles")

          .insert({

            id: usuario.id,

            nombre,

            telefono

          })

          .select()

          .single();

        data = respuesta.data;
        error = respuesta.error;

      }


      if (error) {

        console.log(error);

        alert("No se pudo guardar el perfil");

        return;

      }


      const usuarioActualizado = {

        ...usuario,

        nombre: data.nombre,

        telefono: data.telefono

      };

      localStorage.setItem(

        "usuario",

        JSON.stringify(usuarioActualizado)

      );

      setEditando(false);

      alert("Perfil guardado correctamente");

    }

    catch (error) {

      console.log(error);

      alert("Ocurrió un error");

    }

    finally {

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

            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center">

              <FaUserMd className="text-6xl text-blue-600" />

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

          <h1 className="text-3xl font-bold text-center text-slate-800">

            {nombre}

          </h1>

          <p className="text-center text-slate-500 mt-2">

            Sistema de Gestión de Equipos Médicos

          </p>

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

                  <p className="text-sm text-slate-500 mb-2">

                    Teléfono

                  </p>

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

                  <p className="text-sm text-slate-500 mb-2">

                    Nombre

                  </p>

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

                  <p className="text-sm text-slate-500">

                    Empresa

                  </p>

                  <p className="font-semibold text-slate-800">

                    AD MEDIC

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Botón */}

          <div className="flex justify-center mt-10">

            {

              !editando ?

                (

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

                )

                :

                (

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

                    {

                      loading

                        ? "Guardando..."

                        : "Guardar Cambios"

                    }

                  </button>

                )

            }

          </div>

        </div>

      </div>

    </div>

  );

}