import React, { useState, useEffect } from "react";
import "./POS.css";
import VentasGrafico from "./VentasGrafico";
import { supabase } from "./supabaseClient";
import logo2 from "./logo_2.jpeg"; // tu logo dentro de src/

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setMensajeInventario, setRefreshTrigger }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarLogo, setMostrarLogo] = useState(false);
  const [combos, setCombos] = useState([]);

  // Cargar combos desde Supabase al iniciar
  useEffect(() => {
    const fetchCombos = async () => {
      const { data, error } = await supabase.from("combos").select("*");
      if (error) {
        console.error("Error cargando combos:", error);
      } else {
        setCombos(data);
      }
    };
    fetchCombos();
  }, []);

  // Función para registrar venta de combo
  const registrarVentaCombo = async (comboId, precioCombo) => {
    try {
      // Obtener detalle del combo
      const { data: detalle, error } = await supabase
        .from("combo_detalle")
        .select("producto_id, cantidad")
        .eq("combo_id", comboId);

      if (error) throw error;

      // Registrar la venta del combo
      await supabase.from("ventas").insert([
        {
          producto_id: null,
          cantidad: 1,
          total: precioCombo,
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

      setMensajeInventario("Inventario actualizado después de la venta de combo ✔️");
      setTimeout(() => setMensajeInventario(""), 3000);
      setRefreshTrigger(prev => prev + 1);

    } catch (err) {
      console.error("Error registrando venta de combo:", err);
      alert("Error al registrar venta de combo");
    }
  };

  const aumentarCantidad = () => {
    if (productoSeleccionado && cantidad < productoSeleccionado.cantidad) {
      setCantidad(cantidad + 1);
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  if (!inventario || inventario.length === 0) {
    return <p>Cargando inventario...</p>;
  }

  return (
    <div className="pos-container">
      <header className="pos-header">
        <div className="pos-header-left">
          <button className="logout-btn" onClick={cerrarSesion}>
            🚪 Cerrar sesión
          </button>
        </div>

        <h1 className="pos-title">TPV - {usuario.nombre}</h1>

        <div className="pos-header-right">
          <button className="refresh-btn" onClick={() => actualizarInventario(true)}>
            🔄 Actualizar inventario
          </button>
        </div>
      </header>

      {mensajeInventario && (
        <div className="mensaje-inventario">{mensajeInventario}</div>
      )}

      <div className="pos-layout">
        {/* Lateral izquierdo con logo */}
        <aside className="pos-sidebar-left">
          <img
            src={logo2}
            alt="Logo empresa"
            className="pos-logo"
            onClick={() => setMostrarLogo(true)}
          />
        </aside>

        {/* Contenido principal */}
        <main className="pos-main">
          <VentasGrafico usuario={usuario} refreshTrigger={refreshTrigger} />

          {/* Productos individuales */}
          <h3>Productos individuales</h3>
          <div className="pos-grid">
            {inventario.filter(p => p.categoria === "individual").map((item) => (
              <div key={item.id} className="product-card">
                <h3>{item.nombre}</h3>
                <p className="stock">Stock: {item.cantidad}</p>
                <p className="price">Precio: ${item.precio}</p>
                <button onClick={() => {
                  setProductoSeleccionado(item);
                  setCantidad(1);
                }}>
                  Seleccionar
                </button>
              </div>
            ))}
          </div>

          {productoSeleccionado && (
            <div className="venta-panel">
              <h2>Producto seleccionado</h2>
              <p><strong>{productoSeleccionado.nombre}</strong></p>
              <p>Stock disponible: {productoSeleccionado.cantidad}</p>
              <p>Precio unitario: ${productoSeleccionado.precio}</p>

              <div className="cantidad-selector">
                <button className="cantidad-btn" onClick={disminuirCantidad}>-</button>
                <input
                  type="number"
                  min="1"
                  max={productoSeleccionado.cantidad}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value))}
                />
                <button className="cantidad-btn" onClick={aumentarCantidad}>+</button>
              </div>

              <p className="total">Total: ${cantidad * productoSeleccionado.precio}</p>

              <button
                className="registrar-btn"
                onClick={() => registrarVenta({
                  ...productoSeleccionado,
                  cantidad,
                  total: cantidad * productoSeleccionado.precio
                })}
              >
                Registrar venta
              </button>
            </div>
          )}

          {/* Combos */}
          <h3>Combos</h3>
          <div className="combos-grid">
            {combos.map(combo => (
              <button key={combo.id} onClick={() => registrarVentaCombo(combo.id, combo.precio)}>
                {combo.nombre} - ${combo.precio}
              </button>
            ))}
          </div>
        </main>

        <aside className="pos-sidebar-right">
          <p className="pos-slogan">✨ ¡Tu sabor, nuestra pasión! ✨</p>
        </aside>
      </div>

      {/* Modal para mostrar logo en grande */}
      {mostrarLogo && (
        <div className="modal-overlay" onClick={() => setMostrarLogo(false)}>
          <div className="modal-content">
            <img src={logo2} alt="Logo empresa grande" className="logo-grande" />
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
