import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaInbox,
  FaThLarge,
  FaTasks,
  FaUserCircle,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaBars,
  FaChevronDown,
  FaBox,
  FaFileImport,
} from "react-icons/fa";

// Foto por defecto mientras carga o si el usuario no ha elegido una
const FOTO_DEFAULT = "https://cdn-icons-png.flaticon.com/512/3135/3135768.png";

function PanelControl() {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasMaquinas = [
    "/maquinas/bombas",
    "/maquinas/poles",
    "/maquinas/fuentespoder",
    "/maquinas/baterias",
  ];
  const rutasMaquinasExtra = ["/maquinas/almacenados"];

  const isActive = (path) => location.pathname === path;
  const isActiveGroup = (rutas) => rutas.includes(location.pathname);

  const [open, setOpen] = useState(false); // sidebar en móvil
  const [openMaquinas, setOpenMaquinas] = useState(() =>
    isActiveGroup(rutasMaquinas),
  );
  const [openMaquinasExtra, setOpenMaquinasExtra] = useState(() =>
    isActiveGroup(rutasMaquinasExtra),
  );

  // Datos del usuario logueado
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreUsuarioLogin, setNombreUsuarioLogin] = useState("");
  const [cargoUsuario, setCargoUsuario] = useState("");
  const [fotoUsuario, setFotoUsuario] = useState("");

  useEffect(() => {
    const cargarUsuario = async () => {
      const {
        data: { user },
        error: errorAuth,
      } = await supabase.auth.getUser();

      if (errorAuth || !user) {
        console.log(errorAuth);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("nombre, nombre_usuario, cargo, foto_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.log(error);
        return;
      }

      if (data) {
        setNombreUsuario(data.nombre || "");
        setNombreUsuarioLogin(data.nombre_usuario || "");
        setCargoUsuario(data.cargo || "");
        setFotoUsuario(data.foto_url || "");
      }
    };

    cargarUsuario();
  }, []);

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      return;
    }

    navigate("/");
  };

  const linkClasses = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
      isActive(path)
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
    }`;

  const groupButtonClasses = (isGroupActive) =>
    `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition font-medium ${
      isGroupActive
        ? "bg-blue-600/20 text-white"
        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
    }`;

  const subLinkClasses = (path) =>
    `py-2 text-sm transition rounded-lg px-2 ${
      isActive(path)
        ? "text-white bg-blue-600/30 font-semibold"
        : "text-slate-400 hover:text-white"
    }`;

  return (
    <>
      {/* Botón para abrir en móvil */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-72
          bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950
          shadow-2xl z-50
          flex flex-col
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Botón cerrar (solo móvil) */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Perfil */}
        <Link
          to="/perfil"
          className="flex flex-col items-center pt-10 pb-6"
          onClick={() => setOpen(false)}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 p-1 shadow-lg">
            <img
              src={fotoUsuario || FOTO_DEFAULT}
              alt="Usuario"
              className="w-full h-full rounded-full object-cover border-4 border-slate-900"
            />
          </div>

          <h2 className="text-white font-semibold text-lg mt-4">B. Braun</h2>

          {nombreUsuarioLogin && (
            <p className="text-slate-400 text-sm mt-0.5">
              @{nombreUsuarioLogin}
            </p>
          )}

          {nombreUsuario && (
            <p className="text-slate-200 text-sm mt-1">{nombreUsuario}</p>
          )}

          {cargoUsuario && (
            <p className="text-slate-400 text-xs mt-0.5">{cargoUsuario}</p>
          )}

          <div className="w-16 h-px bg-slate-700 mt-3" />
        </Link>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
          <Link
            to="/"
            className={linkClasses("/")}
            onClick={() => setOpen(false)}
          >
            <FaTachometerAlt className="text-lg" />
            Dashboard
          </Link>

          {/* Dropdown Máquinas */}
          <div>
            <button
              onClick={() => setOpenMaquinas(!openMaquinas)}
              className={groupButtonClasses(isActiveGroup(rutasMaquinas))}
            >
              <span className="flex items-center gap-3">
                <FaThLarge className="text-lg" />
                Equipos y Accesorios
              </span>
              <FaChevronDown
                className={`text-xs transition-transform ${
                  openMaquinas ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMaquinas && (
              <div className="flex flex-col gap-1 pl-11 mt-1">
                <Link
                  to="/maquinas/bombas"
                  className={subLinkClasses("/maquinas/bombas")}
                  onClick={() => setOpen(false)}
                >
                  Bombas
                </Link>
                <Link
                  to="/maquinas/poles"
                  className={subLinkClasses("/maquinas/poles")}
                  onClick={() => setOpen(false)}
                >
                  Poles
                </Link>
                <Link
                  to="/maquinas/fuentespoder"
                  className={subLinkClasses("/maquinas/fuentespoder")}
                  onClick={() => setOpen(false)}
                >
                  Fuente de Poder
                </Link>
                <Link
                  to="/maquinas/baterias"
                  className={subLinkClasses("/maquinas/baterias")}
                  onClick={() => setOpen(false)}
                >
                  Baterías
                </Link>
                <Link
                  to="/maquinas/powercord"
                  className={subLinkClasses("/maquinas/powercord")}
                  onClick={() => setOpen(false)}
                >
                  Power Cord
                </Link>
              </div>
            )}
          </div>

          {/* Dropdown Máquinas Extra */}
          <div>
            <button
              onClick={() => setOpenMaquinasExtra(!openMaquinasExtra)}
              className={groupButtonClasses(isActiveGroup(rutasMaquinasExtra))}
            >
              <span className="flex items-center gap-3">
                <FaBox className="text-lg" />
                Máquinas Extra
              </span>
              <FaChevronDown
                className={`text-xs transition-transform ${
                  openMaquinasExtra ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMaquinasExtra && (
              <div className="flex flex-col gap-1 pl-11 mt-1">
                <Link
                  to="/maquinas/almacenados"
                  className={subLinkClasses("/maquinas/almacenados")}
                  onClick={() => setOpen(false)}
                >
                  Almacenados
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/actividades"
            className={`${linkClasses("/actividades")} justify-between`}
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center gap-3">
              <FaTasks className="text-lg" />
              Mis Actividades
            </span>
          </Link>

          {/*   <Link
            to="/calendario"
            className={linkClasses("/calendario")}
            onClick={() => setOpen(false)}
          >
            <FaCalendarAlt className="text-lg" />
            Calendario
          </Link> */}

          <Link
            to="/reportes"
            className={linkClasses("/reportes")}
            onClick={() => setOpen(false)}
          >
            <FaChartBar className="text-lg" />
            Reportes
          </Link>
          <Link
            to="/importacionRegistro"
            className={linkClasses("/importacionRegistro")}
            onClick={() => setOpen(false)}
          >
            <FaFileImport className="text-lg" />
            Importacion
          </Link>

          <Link
            to="/perfil"
            className={linkClasses("/perfil")}
            onClick={() => setOpen(false)}
          >
            <FaUserCircle className="text-lg" />
            Perfil
          </Link>

          <Link
            to="/configuracion"
            className={linkClasses("/configuracion")}
            onClick={() => setOpen(false)}
          >
            <FaCog className="text-lg" />
            Configuración
          </Link>
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-900/40 hover:text-red-400 transition font-medium"
          >
            <FaSignOutAlt className="text-lg" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default PanelControl;
