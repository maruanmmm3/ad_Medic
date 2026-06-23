function EstadoCard({ titulo, activo, setActivo }) {

  return (

    <div
      onClick={() => setActivo(!activo)}
      className={`
        cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300
        hover:scale-105

        ${activo
          ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/30"
          : "bg-slate-800 border-slate-700 hover:border-cyan-500"}
      `}
    >

      <div className="flex justify-between items-center">

        <h3 className="font-semibold text-lg">
          {titulo}
        </h3>

        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold

            ${activo
              ? "bg-green-500 text-white"
              : "bg-slate-700"}
          `}
        >

          {activo ? "✓" : ""}

        </div>

      </div>

    </div>

  );

}

export default EstadoCard;