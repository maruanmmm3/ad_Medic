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
import AgregarBomba from "../pages/formularios/AgregarBomba";
import EditarBomba from "../pages/formularios/EditarBomba";
import AgregarPole from "../pages/formularios/AgregarPole";
import EditarPole from "../pages/formularios/EditarPole";
import AgregarFuentesPoder from "../pages/formularios/AgregarFuentesPoder";
import EditarFuentesPoder from "../pages/formularios/EditarFuentesPoder";
import AgregarBateria from "../pages/formularios/AgregarBateria";
import AgregarAlmacenados from "../pages/formularios/AgregarAlmacenados";
import EditarBateria from "../pages/formularios/EditarBateria";
import Actividades from "../pages/Actividades";
import Almacenados from "../pages/Almacenados";
import EditarAlmacenado from "../pages/formularios/EditarAlmacenado";
import PowerCord from "../pages/PowerCord";
import AgregarPowerCord from "../pages/formularios/AgregarPowerCord";
import EditarPowerCord from "../pages/formularios/EditarPowerCord";
import Configuracion from "../pages/Configuracion";
import Reportes from "../pages/Reportes";
import ImportacionRegistro from "../pages/ImportacionRegistro";

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
        path="/agregar-bomba"
        element={
          <ProtectedRoute>
            <AgregarBomba />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-bomba/:id"
        element={
          <ProtectedRoute>
            <EditarBomba />
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
        path="/maquinas/almacenados"
        element={
          <ProtectedRoute>
            <Almacenados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agregar-almacenados"
        element={
          <ProtectedRoute>
            <AgregarAlmacenados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-almacenado/:id"
        element={
          <ProtectedRoute>
            <EditarAlmacenado />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maquinas/powercord"
        element={
          <ProtectedRoute>
            <PowerCord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agregar-powercord"
        element={
          <ProtectedRoute>
            <AgregarPowerCord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-powercord/:id"
        element={
          <ProtectedRoute>
            <EditarPowerCord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <Reportes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/importacionRegistro"
        element={
          <ProtectedRoute>
            <ImportacionRegistro />
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
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <Configuracion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actividades"
        element={
          <ProtectedRoute>
            <Actividades />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
