
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import Navbar from '../components/Navbar.jsx';

export default function Home() {

  const navigate = useNavigate();

  useEffect(()=> {
    const obtenerDatos = async () => {
      const { data, error } = await supabase
      .from("maquinas")
      .select("*");
      
      console.log(data);

      if(error){
        console.log(error);
      }
    };

    obtenerDatos();
  },[]);

    return (

      <div>
        <Navbar />
        <h1>Hola Supabase</h1>
      </div>

    );
     
  }