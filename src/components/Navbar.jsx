import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
// import { supabase } from "../lib/supabase";

function Navbar() {

  const [open, setOpen] = useState(false);

  const [openPerfil, setOpenPerfil] = useState(false);

  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  }

  return (

    <nav className="bg-white shadow-md">

      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">

            <div className="relative">

              <button
                onClick={() => setOpenPerfil(!openPerfil)}
                className="
                  w-10 h-10
                  bg-blue-600
                  rounded-full
                  flex items-center justify-center
                  text-white font-bold
                  hover:bg-blue-700
                  transition
                "
              >
                +
              </button>


              {/* Menú Perfil */}

              {openPerfil && (

                <div
                  className="
                    absolute
                    top-12
                    left-0
                    w-48
                    bg-white
                    rounded-xl
                    shadow-xl
                    border
                    border-gray-100
                    overflow-hidden
                    z-50
                  "
                >

                  <Link
                    to="/perfil"
                    onClick={() => setOpenPerfil(false)}
                    className="
                      block
                      px-4
                      py-3
                      text-gray-700
                      hover:bg-gray-100
                      transition
                    "
                  >
                    👤 Perfil
                  </Link>

                  <button
                    onClick={cerrarSesion}
                    className="
                      w-full
                      text-left
                      px-4
                      py-3
                      text-gray-700
                      hover:bg-red-50
                      hover:text-red-600
                      transition
                    "
                  >
                    🚪 Cerrar sesión
                  </button>

                </div>

              )}

            </div>

            <div>

              <h1 className="font-bold text-xl text-gray-800">
                AD MEDIC
              </h1>

              <p className="text-xs text-gray-500">
                Equipos Médicos
              </p>

            </div>

          </div>

          {/* Menú PC */}

          <div className="hidden md:flex gap-8">

            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Inicio
            </Link>

            <Link
              to="/maquinas"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Máquinas
            </Link>

            <Link
              to="/contacto"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Contacto
            </Link>

          </div>

          {/* Botón celular */}

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  open
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />

            </svg>

          </button>

        </div>

      </div>

      {/* Menú celular */}

      {open && (

        <div className="md:hidden bg-white border-t">

          <div className="flex flex-col p-4 gap-4">

            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              Inicio
            </Link>

            <Link
              to="/maquinas"
              className="text-gray-700 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              Máquinas
            </Link>

            <Link
              to="/contacto"
              className="text-gray-700 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              Contacto
            </Link>

          </div>

        </div>

      )}

    </nav>

  );

}

export default Navbar;