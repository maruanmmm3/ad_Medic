import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Maquinas from "../pages/Maquinas";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Perfil from "../pages/Perfil";
import AgregarMaquina from "../pages/formularios/AgregarMaquina";
import EditarMaquina from "../pages/formularios/EditarMaquina";

function AppRoutes() {
  return (
    <Routes>
    <Route 
      path="/" 
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
        } 
      />

    <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

    <Route 
      path="/maquinas" 
      element={
        <ProtectedRoute>
          <Maquinas />
        </ProtectedRoute>
        } 
      />
    <Route
      path="/agregar-maquina"
      element={
        <ProtectedRoute>
          <AgregarMaquina />
        </ProtectedRoute>
        }
      />
      <Route
      path="/editar-maquina/:id"
      element={
        <ProtectedRoute>
          <EditarMaquina />
        </ProtectedRoute>
        }
      />
      <Route 
      path="/perfil" 
      element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
        } 
      />
    </Routes>

  );
}

export default AppRoutes;