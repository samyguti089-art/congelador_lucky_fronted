import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./login";
import POS from "./pos";
import OwnerDashboard from "./components/OwnerDashboard";
import { supabase } from "./supabaseClient";
import { STORE_NAME } from "./utils/storeConfig";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [mensajeInventario, setMensajeInventario] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = STORE_NAME;
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

  const cargarInventario = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("inventario").select("*");
    if (!error && data) setInventario(data);
  };

  const actualizarInventario = async (forzarRecarga = false) => {
    try {
      const res = await axios.get(`${API_URL}/inventario`);
      setInventario(res.data);
      if (forzarRecarga) {
        window.location.reload();
      } else {
        setMensajeInventario("Inventario actualizado correctamente");
        setTimeout(() => setMensajeInventario(""), 3000);
      }
    } catch (err) {
      console.error("Error actualizando inventario:", err);
      setMensajeInventario("Error al actualizar inventario");
      setTimeout(() => setMensajeInventario(""), 3000);
    }
  };

  const rolNormalizado = (usuario?.rol || "").toLowerCase().trim();
  const esPanelDueno =
    rolNormalizado === "dueño" ||
    rolNormalizado === "dueno" ||
    rolNormalizado === "admin" ||
    rolNormalizado === "administrador";

  // ===== EFECTO PARA CARGAR DATOS SEGÚN ROL =====
  useEffect(() => {
    if (usuario) {
      if (!API_URL || !supabase) return;
      if (rolNormalizado === "cajero") {
        actualizarInventario();
      } else if (esPanelDueno) {
        cargarInventario();
      }
    }
  }, [usuario]);

  const registrarVenta = async (item) => {
    try {
      const res = await axios.post(
        `${API_URL}/venta`,
        {
          producto_id: item.id,
          cantidad: item.cantidad,
          total: item.total,
        },
        {
          params: { cajero_id: usuario.id },
        }
      );
      alert(res.data.mensaje);
      if (res.data.inventario) {
        setInventario(res.data.inventario);
        setMensajeInventario("Inventario actualizado después de la venta");
        setTimeout(() => setMensajeInventario(""), 3000);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error registrando venta:", err);
      alert("Error al registrar venta");
    }
  };

  const missingConfiguration = [
    !API_URL && "VITE_API_URL",
    !import.meta.env.VITE_SUPABASE_URL && "VITE_SUPABASE_URL",
    !import.meta.env.VITE_SUPABASE_KEY && "VITE_SUPABASE_KEY",
  ].filter(Boolean);

  if (!usuario) {
    return (
      <Login
        setUsuario={manejarLogin}
        modoVistaPrevia={missingConfiguration.length > 0}
      />
    );
  }

  if (rolNormalizado === "cajero") {
    return (
      <>
        {(usuario.vista_previa || missingConfiguration.length > 0) && (
          <div
            role="status"
            style={{
              background: "#fff7d6",
              color: "#704b00",
              fontFamily: "Arial, sans-serif",
              padding: "10px 16px",
              textAlign: "center",
            }}
          >
            Vista previa sin datos: conecta el backend para habilitar ventas y consultas.
          </div>
        )}
        <POS
          usuario={usuario}
          inventario={inventario}
          registrarVenta={registrarVenta}
          actualizarInventario={actualizarInventario}
          mensajeInventario={mensajeInventario}
          refreshTrigger={refreshTrigger}
          cerrarSesion={cerrarSesion}
          setRefreshTrigger={setRefreshTrigger}
        />
      </>
    );
  }

  if (esPanelDueno) {
    return (
      <OwnerDashboard
        usuario={usuario}
        cerrarSesion={cerrarSesion}
        actualizarInventario={actualizarInventario}
        mensajeInventario={mensajeInventario}
        inventario={inventario}
      />
    );
  }

  return <div>Rol desconocido ({usuario.rol})</div>;
}

export default App;
