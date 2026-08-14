import { FaTools } from "react-icons/fa";

export default function Configuracion() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FaTools className="w-6 h-6 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Configuración
        </h1>
        <p className="text-slate-500">
          Esta sección aún no está disponible. Estamos trabajando en ello.
        </p>
      </div>
    </div>
  );
}
