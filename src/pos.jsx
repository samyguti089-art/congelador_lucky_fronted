import React, { useState, useEffect } from "react";
import "./POS.css";
import VentasGrafico from "./VentasGrafico";
import { supabase } from "./supabaseClient";
import logo2 from "./logo_2.jpeg";

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setMensajeInventario, setRefreshTrigger }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarLogo, setMostrarLogo] = useState(false);
  const [combos, setCombos] = useState([]);
  const [mostrarSubcategorias, setMostrarSubcategorias] = useState(false);
  const [subcategorias, setSubcategorias] = useState([]);

  // Cargar combos desde Supabase
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

  // Mostrar subcategorías de Deditos
  const abrirSubcategoriasDeditos = () => {
    const deditos = inventario.filter(item => item.categoria === "deditos");
    setSubcategorias(deditos);
    setMostrarSubcategorias(!mostrarSubcategorias);
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
        <aside className="pos-sidebar-left">
          <img
            src={logo2}
            alt="Logo empresa"
            className="pos-logo"
            onClick={() => setMostrarLogo(true)}
          />
        </aside>

        <main className="pos-main">
          <VentasGrafico usuario={usuario} refreshTrigger={refreshTrigger} />

          {/* Botón principal de Deditos */}
          <h3>Categorías principales</h3>
          <div className="categoria-card">
            <button className="categoria-btn" onClick={abrirSubcategoriasDeditos}>
              🥖 Deditos
            </button>

            {/* Lista desplegable de subcategorías */}
            {mostrarSubcategorias && (
              <div className="subcategorias-list">
                {subcategorias.map(item => (
                  <div key={item.id} className="subcategoria-card">
                    <h4>{item.subcategoria}</h4>
                    <p>Precio: ${item.precio}</p>
                    <p>Stock: {item.cantidad}</p>
                    <button
                      onClick={() => registrarVenta({
                        ...item,
                        cantidad: 1,
                        total: item.precio
                      })}
                    >
                      Seleccionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aquí siguen tus productos individuales y combos */}
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

      {/* Modal para logo */}
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
