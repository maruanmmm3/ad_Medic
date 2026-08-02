import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PublicRoute({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Revisamos si ya hay una sesión activa al cargar la ruta
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });

    // 2. Nos suscribimos a cambios de sesión (login/logout, expiración, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nuevaSesion) => {
        setSesion(nuevaSesion);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return sesion ? <Navigate to="/home" replace /> : children;
}
