import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./login";
import POS from "./pos";
import AdminDashboard from "./AdminDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import { supabase } from "./supabaseClient";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mensajeInventario, setMensajeInventario] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  // ✅ Usar sessionStorage en lugar de localStorage
  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const manejarLogin = (user) => {
    setUsuario(user);
    sessionStorage.setItem("usuario", JSON.stringify(user));
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("usuario");
    setUsuario(null);
  };

  // ... resto de funciones (cargarInventario, etc.) sin cambios ...

  // Renderizado principal
  if (!usuario) {
    return <Login setUsuario={manejarLogin} />;
  }

  if (usuario.rol === "cajero") {
    return (
      <POS
        usuario={usuario}
        inventario={inventario}
        registrarVenta={registrarVenta}
        actualizarInventario={actualizarInventario}
        mensajeInventario={mensajeInventario}
        refreshTrigger={refreshTrigger}
        cerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuario.rol === "admin") {
    return (
      <AdminDashboard
        usuario={usuario}
        usuarios={usuarios}
        inventario={inventario}
        ventas={ventas}
        agregarUsuario={agregarUsuario}
        eliminarUsuario={eliminarUsuario}
        agregarProducto={agregarProducto}
        actualizarProducto={actualizarProducto}
        eliminarProducto={eliminarProducto}
        cerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuario.rol === "dueño") {
    return <OwnerDashboard usuario={usuario} cerrarSesion={cerrarSesion} />;
  }

  return <div>Rol desconocido</div>;
}

export default App;
