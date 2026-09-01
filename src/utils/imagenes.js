// src/utils/imagenes.js
//
// Supabase guarda algo como: "src/assets/images/CORTADA_ISP.png"
// Pero en el navegador esa ruta NO sirve directamente como src de un <img>,
// porque Vite necesita procesar/optimizar los assets al compilar.
//
// import.meta.glob carga TODAS las imágenes de la carpeta una sola vez
// (en build time) y nos da un mapa { rutaOriginal: urlFinal }.
// Con eso, buscamos por nombre de archivo y devolvemos la URL correcta,
// tanto en desarrollo como en producción.

const imagenes = import.meta.glob("/src/assets/images/*", {
  eager: true,
  import: "default",
});

/**
 * Recibe el valor guardado en categorias.url_imagen
 * (ej: "src/assets/images/CORTADA_ISP.png") y devuelve la URL
 * que Vite generó para esa imagen, o null si no existe / no hay imagen.
 */
export function obtenerUrlImagen(urlImagen) {
  if (!urlImagen) return null;

  const nombreArchivo = urlImagen.split("/").pop(); // "CORTADA_ISP.png"

  const entrada = Object.entries(imagenes).find(([ruta]) =>
    ruta.endsWith("/" + nombreArchivo),
  );

  return entrada ? entrada[1] : null;
}
