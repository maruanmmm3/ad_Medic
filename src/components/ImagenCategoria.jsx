import { obtenerUrlImagen } from "../utils/imagenes";

/**
 * Muestra la imagen de referencia de una categoría (equipo médico).
 *
 * - Si la categoría no tiene url_imagen, o el archivo no existe,
 *   el componente no renderiza NADA (no rompe el formulario, no
 *   muestra huecos ni textos de error). Así cumplimos con:
 *   "si no hay imagen en la categoría no importa".
 *
 * - Es responsive: en celular ocupa el ancho disponible con una
 *   altura contenida; en pantallas más grandes se limita el ancho
 *   máximo para que no se vea gigante.
 */
export default function ImagenCategoria({ urlImagen, nombre }) {
  const src = obtenerUrlImagen(urlImagen);

  if (!src) return null;

  return (
    <div className="mt-2 flex flex-col items-center animate-[fadeIn_0.2s_ease-in-out]">
      <div
        className="
          w-full max-w-[240px] sm:max-w-[280px]
          aspect-square
          bg-white
          border-2 border-cyan-100
          rounded-2xl
          shadow-sm
          flex items-center justify-center
          p-4
        "
      >
        <img
          src={src}
          alt={nombre ? `Referencia: ${nombre}` : "Referencia de la categoría"}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>

      {nombre && (
        <p className="mt-2 text-sm text-slate-500 text-center">{nombre}</p>
      )}
    </div>
  );
}
