import React, { useState, useEffect } from "react";
import "./POS.css";
import VentasGrafico from "./VentasGrafico";
import { supabase } from "./supabaseClient";
import logo2 from "./logo_2.jpeg";

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setMensajeInventario, setRefreshTrigger }) {
  const [combos, setCombos] = useState([]);
  const [mostrarLogo, setMostrarLogo] = useState(false);

  // Estados para subcategorías
  const [mostrarModalSubcategorias, setMostrarModalSubcategorias] = useState(false);
  const [subcategorias, setSubcategorias] = useState([]);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  // Cargar combos
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

  // Abrir modal con subcategorías de Deditos
  const abrirModalDeditos = () => {
    const deditos = inventario.filter(item => item.categoria === "deditos");
    setSubcategorias(deditos);
    setMostrarModalSubcategorias(true);
  };

  // Seleccionar una subcategoría
  const seleccionarSubcategoria = (item) => {
    setSubcategoriaSeleccionada(item);
    setCantidad(1);
  };

  // Confirmar venta
  const confirmarVenta = () => {
    if (!subcategoriaSeleccionada) return;
    registrarVenta({
      ...subcategoriaSeleccionada,
      cantidad,
      total: cantidad * subcategoriaSeleccionada.precio
    });
    setMostrarModalSubcategorias(false);
    setSubcategoriaSeleccionada(null);
  };

  return (
    <div className="pos-container">
      <header className="pos-header">
        <div className="pos-header-left">
          <button className="logout-btn" onClick={cerrarSesion}>🚪 Cerrar sesión</button>
        </div>
        <h1 className="pos-title">TPV - {usuario.nombre}</h1>
        <div className="pos-header-right">
          <button className="refresh-btn" onClick={() => actualizarInventario(true)}>🔄 Actualizar inventario</button>
        </div>
      </header>

      {mensajeInventario && <div className="mensaje-inventario">{mensajeInventario}</div>}

      <div className="pos-layout">
        <aside className="pos-sidebar-left">
          <img src={logo2} alt="Logo empresa" className="pos-logo" onClick={() => setMostrarLogo(true)} />
        </aside>

        <main className="pos-main">
          <VentasGrafico usuario={usuario} refreshTrigger={refreshTrigger} />

          {/* Card de Deditos */}
          <h3>Categorías principales</h3>
          <div className="product-card" onClick={abrirModalDeditos}>
            <h3>Deditos</h3>
            <p className="info">Haz clic para ver subcategorías</p>
          </div>

          {/* Productos individuales */}
          <h3>Productos individuales</h3>
          <div className="pos-grid">
            {inventario.filter(p => p.categoria === "individual").map((item) => (
              <div key={item.id} className="product-card">
                <h3>{item.nombre}</h3>
                <p className="stock">Stock: {item.cantidad}</p>
                <p className="price">Precio: ${item.precio}</p>
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

      {/* Modal de subcategorías de Deditos */}
      {mostrarModalSubcategorias && (
        <div className="modal-overlay" onClick={() => setMostrarModalSubcategorias(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!subcategoriaSeleccionada ? (
              <>
                <h3>Subcategorías de Deditos</h3>
                <ul>
                  {subcategorias.map(item => (
                    <li key={item.id} className="subcategoria-item">
                      <p><strong>{item.subcategoria}</strong></p>
                      <p>Precio: ${item.precio}</p>
                      <p>Stock: {item.cantidad}</p>
                      <button onClick={() => seleccionarSubcategoria(item)}>Seleccionar</button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3>Venta de {subcategoriaSeleccionada.subcategoria}</h3>
                <p>Precio unitario: ${subcategoriaSeleccionada.precio}</p>
                <p>Stock disponible: {subcategoriaSeleccionada.cantidad}</p>
                <div className="cantidad-selector">
                  <button onClick={() => cantidad > 1 && setCantidad(cantidad - 1)}>-</button>
                  <input
                    type="number"
                    min="1"
                    max={subcategoriaSeleccionada.cantidad}
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value))}
                  />
                  <button onClick={() => cantidad < subcategoriaSeleccionada.cantidad && setCantidad(cantidad + 1)}>+</button>
                </div>
                <p>Total: ${cantidad * subcategoriaSeleccionada.precio}</p>
                <button className="registrar-btn" onClick={confirmarVenta}>Registrar venta</button>
              </>
            )}
          </div>
        </div>
      )}

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
