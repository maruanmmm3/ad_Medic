import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  const usuario = localStorage.getItem("usuario");

  return usuario ? children : <Navigate to="/" replace />;

  /* return children; */

}