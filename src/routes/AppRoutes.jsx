import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Bombas from "../pages/Bombas";
import Poles from "../pages/Poles";
import FuentesPoder from "../pages/FuentePoder";
import Baterias from "../pages/Baterias";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Perfil from "../pages/Perfil";
import AgregarMaquina from "../pages/formularios/AgregarMaquina";
import EditarMaquina from "../pages/formularios/EditarMaquina";
import AgregarPole from "../pages/formularios/AgregarPole";
import EditarPole from "../pages/formularios/EditarPole";
import AgregarFuentesPoder from "../pages/formularios/AgregarFuentesPoder";
import EditarFuentesPoder from "../pages/formularios/EditarFuentesPoder";
import AgregarBateria from "../pages/formularios/AgregarBateria";
import EditarBateria from "../pages/formularios/EditarBateria";

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
        path="/maquinas/bombas"
        element={
          <ProtectedRoute>
            <Bombas />
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
        path="/maquinas/poles"
        element={
          <ProtectedRoute>
            <Poles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agregar-pole"
        element={
          <ProtectedRoute>
            <AgregarPole />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-pole/:id"
        element={
          <ProtectedRoute>
            <EditarPole />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maquinas/fuentespoder"
        element={
          <ProtectedRoute>
            <FuentesPoder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agregar-fuentespoder"
        element={
          <ProtectedRoute>
            <AgregarFuentesPoder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-fuentespoder/:id"
        element={
          <ProtectedRoute>
            <EditarFuentesPoder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maquinas/baterias"
        element={
          <ProtectedRoute>
            <Baterias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agregar-bateria"
        element={
          <ProtectedRoute>
            <AgregarBateria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-bateria/:id"
        element={
          <ProtectedRoute>
            <EditarBateria />
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
