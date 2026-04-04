import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./login";
import POS from "./pos";
import AdminDashboard from "./AdminDashboard";
import { supabase } from "./supabaseClient";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mensajeInventario, setMensajeInventario] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Cargar usuario guardado
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const manejarLogin = (user) => {
    setUsuario(user);
    localStorage.setItem("usuario", JSON.stringify(user));
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  // 🔹 Funciones Supabase
  const cargarInventario = async () => {
    const { data, error } = await supabase.from("inventario").select("*");
    if (!error) setInventario(data);
  };

  const cargarUsuarios = async () => {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (!error) setUsuarios(data);
  };

  const cargarVentas = async () => {
    const { data, error } = await supabase.from("ventas").select("*");
    if (!error) setVentas(data);
  };

  const agregarUsuario = async (nuevoUsuario) => {
    const { data, error } = await supabase.from("usuarios").insert([nuevoUsuario]);
    if (!error) setUsuarios([...usuarios, ...data]);
  };

  const eliminarUsuario = async (id) => {
    await supabase.from("usuarios").delete().eq("id", id);
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  const agregarProducto = async (producto) => {
    const { data, error } = await supabase.from("inventario").insert([producto]);
    if (!error) setInventario([...inventario, ...data]);
  };

  const actualizarProducto = async (id, cambios) => {
    const { data, error } = await supabase.from("inventario").update(cambios).eq("id", id);
    if (!error) {
      setInventario(inventario.map(p => p.id === id ? { ...p, ...cambios } : p));
    }
  };

  const eliminarProducto = async (id) => {
    await supabase.from("inventario").delete().eq("id", id);
    setInventario(inventario.filter(p => p.id !== id));
  };

  // 🔹 Inventario para cajero (desde backend API)
  const actualizarInventario = async (forzarRecarga = false) => {
    try {
      const res = await axios.get(`${API_URL}/inventario`);
      setInventario(res.data);

      if (forzarRecarga) {
        window.location.reload();
      } else {
        setMensajeInventario("Inventario actualizado correctamente ✔️");
        setTimeout(() => setMensajeInventario(""), 3000);
      }
    } catch (err) {
      console.error("Error actualizando inventario:", err);
      setMensajeInventario("❌ Error al actualizar inventario");
      setTimeout(() => setMensajeInventario(""), 3000);
    }
  };

  useEffect(() => {
    if (usuario && usuario.rol === "cajero") {
      actualizarInventario();
    }
    if (usuario && usuario.rol === "admin") {
      cargarInventario();
      cargarUsuarios();
      cargarVentas();
    }
  }, [usuario]);

  const registrarVentaFinal = async () => {
  try {
    for (const item of carrito) {
      await axios.post(`${API_URL}/venta`, {
        producto_id: item.id,       // ahora sí existe
        cantidad: item.cantidad,
        total: item.subtotal
      }, {
        params: { cajero_id: usuario.id }
      });
    }
    alert("Venta registrada con éxito");
    setCarrito([]); // limpiar carrito
  } catch (error) {
    console.error(error);
    alert("Error registrando la venta");
  }
};
      if (res.data.inventario) {
        setInventario(res.data.inventario);
        setMensajeInventario("Inventario actualizado después de la venta ✔️");
        setTimeout(() => setMensajeInventario(""), 3000);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error registrando venta:", err);
      alert("Error al registrar venta");
    }
  };
  // Función para registrar venta de combo
const registrarVentaCombo = async (comboId, precioCombo) => {
  try {
    // Obtener detalle del combo desde Supabase
    const { data: detalle, error } = await supabase
      .from("combo_detalle")
      .select("producto_id, cantidad")
      .eq("combo_id", comboId);

    if (error) throw error;

    // Registrar la venta del combo en la tabla ventas
    await supabase.from("ventas").insert([
      { 
        producto_id: null,   // porque es un combo, no un producto individual
        cantidad: 1,         // siempre 1 combo por venta
        total: precioCombo,  // aquí usamos la variable con el precio real del combo
        cajero_id: usuario.id 
      }
    ]);

    // Descontar inventario de cada producto incluido en el combo
    for (const item of detalle) {
      const producto = inventario.find(p => p.id === item.producto_id);
      if (producto) {
        await supabase
          .from("inventario")
          .update({ cantidad: producto.cantidad - item.cantidad })
          .eq("id", item.producto_id);
      }
    }

    // Feedback visual
    setMensajeInventario("Inventario actualizado después de la venta de combo ✔️");
    setTimeout(() => setMensajeInventario(""), 3000);
    setRefreshTrigger(prev => prev + 1);

  } catch (err) {
    console.error("Error registrando venta de combo:", err);
    alert("Error al registrar venta de combo");
  }
};


  // 🔹 Renderizado
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

  return <div>Rol desconocido</div>;
}

export default App;
