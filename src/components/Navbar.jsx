import { Link } from "react-router-dom";

function Navbar() {
  return (
    <>
      <Link to="/">Inicio</Link>

      <Link to="/productos">Productos</Link>

      <Link to="/contacto">Contacto</Link>
    </>
  );
}

export default Navbar;