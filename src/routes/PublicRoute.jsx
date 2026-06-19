import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {

  const usuario = localStorage.getItem("usuario");

  return usuario ? <Navigate to="/home" replace /> : children;
}