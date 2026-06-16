import { Navigate } from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {

  const [session, setSession] = useState(undefined);

  useEffect(()=>{

    supabase.auth.getSession()

    .then(({ data }) => {

      setSession(data.session);

    });

  },[]);

  if(session === undefined){

    return <p>Cargando...</p>;

  }

  if(!session){

    return <Navigate to="/" />;

  }

  return children;

}