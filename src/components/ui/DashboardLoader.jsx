import { FaHeartbeat } from "react-icons/fa";

export default function DashboardLoader() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-[6px] border-cyan-200"></div>

          <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-cyan-600 animate-spin"></div>

          <FaHeartbeat className="absolute inset-0 m-auto text-cyan-600 text-4xl animate-pulse" />
        </div>

        <h2 className="mt-8 text-3xl font-bold text-slate-700">
          Dashboard Médico
        </h2>

        <p className="text-slate-500 mt-2">Cargando información...</p>
      </div>
    </div>
  );
}
