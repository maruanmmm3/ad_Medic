import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf } from "react-icons/fa";
import { toPng } from "html-to-image";

export default function ReporteSemanalPDF({
  totalEquipos,
  completadas,
  pendientes,
}) {
  const capturarGrafico = async (id) => {
    const elemento = document.getElementById(id);
    if (!elemento) return null;

    // pixelRatio más alto = imagen más nítida (clave contra la pérdida de calidad)
    const dataUrl = await toPng(elemento, {
      backgroundColor: "#ffffff",
      pixelRatio: 3,
    });

    // Necesitamos también el ancho/alto real para no deformar la proporción
    const dimensiones = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = dataUrl;
    });

    return { dataUrl, ...dimensiones };
  };

  const generarPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");

    // ============================
    // FECHAS
    // ============================
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diferencia);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const formatoFecha = (fecha) => fecha.toLocaleDateString("es-PE");

    // ============================
    // ENCABEZADO
    // ============================
    pdf.setFontSize(20);
    pdf.text("Reporte Semanal de Equipos Médicos", 20, 25);

    pdf.setFontSize(12);
    pdf.text(
      `Periodo: ${formatoFecha(lunes)} - ${formatoFecha(domingo)}`,
      20,
      35,
    );
    pdf.text(`Generado: ${formatoFecha(hoy)}`, 20, 42);

    // ============================
    // RESUMEN
    // ============================
    pdf.setFontSize(16);
    pdf.text("Resumen General", 20, 60);

    autoTable(pdf, {
      startY: 70,
      head: [["Indicador", "Cantidad"]],
      body: [
        ["Total Equipos Médicos", totalEquipos],
        ["Equipos Completados", completadas],
        ["Equipos Pendientes", pendientes],
      ],
      theme: "grid",
    });

    // ============================
    // ESTADO
    // ============================
    const posicion = pdf.lastAutoTable.finalY + 20;

    pdf.setFontSize(16);
    pdf.text("Detalle del Reporte", 20, posicion);

    pdf.setFontSize(12);
    pdf.text("• Bombas", 25, posicion + 15);
    pdf.text("• Pole", 25, posicion + 25);
    pdf.text("• Fuente de Poder", 25, posicion + 35);
    pdf.text("• Baterías", 25, posicion + 45);

    // ============================
    // PIE DE LA PRIMERA PÁGINA
    // ============================
    pdf.setFontSize(10);
    pdf.text("Sistema de monitoreo de equipos médicos", 20, 285);

    // ============================
    // CAPTURAR GRÁFICOS
    // ============================
    const graficos = [
      {
        titulo: "Producción semanal",
        data: await capturarGrafico("grafico-barra"),
      },
      {
        titulo: "Distribución por usuarios",
        data: await capturarGrafico("grafico-usuarios"),
      },
      {
        titulo: "Estado de Bombas",
        data: await capturarGrafico("grafico-bomba"),
      },
      { titulo: "Estado de Pole", data: await capturarGrafico("grafico-pole") },
      {
        titulo: "Estado de Fuente de Poder",
        data: await capturarGrafico("grafico-fuente"),
      },
      {
        titulo: "Estado de Baterías",
        data: await capturarGrafico("grafico-bateria"),
      },
    ].filter((g) => g.data); // descarta los que no se pudieron capturar

    // ============================
    // AGREGAR PÁGINAS (2 GRÁFICOS POR PÁGINA)
    // ============================
    const anchoMaximo = 140; // mm — más angosto que antes, para no perder nitidez
    const margenX = (210 - anchoMaximo) / 2; // centrado horizontal en A4 (210mm de ancho)

    const posicionesY = [30, 165]; // posición vertical para el 1° y 2° gráfico de cada página

    for (let i = 0; i < graficos.length; i += 2) {
      pdf.addPage();

      const par = [graficos[i], graficos[i + 1]];

      par.forEach((grafico, idx) => {
        if (!grafico) return;

        const { dataUrl, width, height } = grafico.data;

        // Calcular alto proporcional según el ancho fijo, para no deformar la imagen
        const alto = (height / width) * anchoMaximo;

        const y = posicionesY[idx];

        pdf.setFontSize(14);
        pdf.text(grafico.titulo, margenX, y - 5);

        pdf.addImage(dataUrl, "PNG", margenX, y, anchoMaximo, alto);
      });
    }

    // ============================
    // GUARDAR PDF
    // ============================
    pdf.save("Reporte-Semanal-Equipos-Medicos.pdf");
  };

  return (
    <button
      onClick={generarPDF}
      className="
      flex items-center gap-2
      bg-red-600
      hover:bg-red-700
      text-white
      px-5 py-3
      rounded-xl
      font-semibold
      shadow-lg
      transition
      "
    >
      <FaFilePdf />
      Generar Reporte PDF
    </button>
  );
}
