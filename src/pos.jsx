import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiLogOut, FiCheckCircle } from "react-icons/fi";
import "./POS.css";

function POS({ usuario, inventario, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setRefreshTrigger }) {
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productosCategoria, setProductosCategoria] = useState([]);
  const [combos, setCombos] = useState([]);
  const [comboSeleccionado, setComboSeleccionado] = useState(null);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [mostrarModalCombos, setMostrarModalCombos] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar combos desde Supabase
  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase
        .from("combos")
        .select("*");
      if (error) throw error;
      setCombos(data || []);
    } catch (err) {
      console.error("Error cargando combos:", err);
    }
  };

  // Definir categorías con íconos y nombres
  const categorias = [
    { id: "deditos", nombre: "Deditos", icono: "🍢", color: "#d97706" },
    { id: "empanadas", nombre: "Empanadas", icono: "🥟", color: "#b45309" },
    { id: "medallones", nombre: "Medallones", icono: "🍔", color: "#9b2c2c" },
    { id: "bolitas", nombre: "Bolitas", icono: "🫘", color: "#854d0e" },
    { id: "carimañolas", nombre: "Mini Carimañolas", icono: "🥟", color: "#c2410c" },
    { id: "pizzas", nombre: "Mini Pizzas", icono: "🍕", color: "#b91c1c" },
    { id: "hayacas", nombre: "Mini Hayacas", icono: "🌽", color: "#a16207" },
    { id: "combos", nombre: "Combos", icono: "🍱", color: "#6b21a5" }
  ];

  // Filtrar productos por categoría
  const abrirCategoria = (categoriaId) => {
    if (categoriaId === "combos") {
      setMostrarModalCombos(true);
      return;
    }
    
    const productos = inventario.filter(item => 
      item.categoria?.toLowerCase() === categoriaId.toLowerCase() ||
      item.subcategoria?.toLowerCase().includes(categoriaId.toLowerCase())
    );
    setProductosCategoria(productos);
    setCategoriaSeleccionada(categoriaId);
    setMostrarModalProductos(true);
  };

  // Seleccionar combo
  const seleccionarCombo = (combo) => {
    setComboSeleccionado(combo);
  };

  // Agregar combo al carrito
  const agregarComboAlCarrito = (combo, cantidad = 1) => {
    const item = {
      id: combo.id,
      nombre: combo.nombre,
      precio: combo.precio,
      cantidad: cantidad,
      subtotal: cantidad * combo.precio,
      esCombo: true,
      productos: combo.productos // Guardar los productos del combo para referencia
    };
    setCarrito(prev => [...prev, item]);
    setComboSeleccionado(null);
    setMostrarModalCombos(false);
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const item = {
      id: producto.id,
      nombre: producto.subcategoria || producto.nombre,
      precio: producto.precio,
      cantidad: cantidad,
      subtotal: cantidad * producto.precio,
      esCombo: false
    };
    setCarrito(prev => [...prev, item]);
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  const registrarVentaFinal = async () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    const productosParaBackend = carrito.map(item => ({
      producto_id: item.esCombo ? null : item.id,
      combo_id: item.esCombo ? item.id : null,
      cantidad: item.cantidad,
      total: item.subtotal
    }));

    try {
      const response = await axios.post(`${API_URL}/venta-carrito`, {
        cajero_id: usuario.id,
        productos: productosParaBackend
      });

      console.log("Respuesta exitosa:", response.data);
      
      setVentaExitosa({
        id: response.data.id_venta,
        productos: [...carrito],
        total: response.data.total,
        fecha: new Date().toLocaleString()
      });
      
      setCarrito([]);
      setMostrarModalExito(true);
      
      if (response.data.inventario && actualizarInventario) {
        actualizarInventario(response.data.inventario);
      }
      if (setRefreshTrigger) setRefreshTrigger(prev => !prev);
      
    } catch (error) {
      console.error("Error al registrar venta del carrito:", error);
      if (error.response) {
        alert(`Error ${error.response.status}: ${error.response.data.detail || JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        alert("No se recibió respuesta del servidor. Revisa que el backend esté activo.");
      } else {
        alert("Error al preparar la solicitud: " + error.message);
      }
    }
  };

  const handleCerrarSesion = () => {
    setMostrarModalCierre(true);
  };

  const confirmarCierre = () => {
    setCerrando(true);
    setTimeout(() => {
      cerrarSesion();
    }, 1500);
  };

  const cancelarCierre = () => {
    setMostrarModalCierre(false);
  };

  const cerrarModalExito = () => {
    setMostrarModalExito(false);
    setVentaExitosa(null);
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="logo-area">
          <h1>🍔 Congelador Lucky</h1>
          <span className="pos-badge">Punto de Venta</span>
        </div>
        <div className="user-area">
          <div className="user-details">
            <span className="user-icon">👤</span>
            <div className="user-text">
              <span className="user-name">{usuario.nombre}</span>
              <span className="user-role">Cajero</span>
            </div>
          </div>
          <button onClick={handleCerrarSesion} className="logout-btn">
            <FiLogOut className="logout-icon" /> Salir
          </button>
        </div>
      </div>

      {/* Mensaje de inventario */}
      {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}

      {/* Grid de categorías */}
      <div className="categorias-grid">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            className="categoria-card"
            data-categoria={cat.id}
            onClick={() => abrirCategoria(cat.id)}
          >
            <span className="categoria-icono">{cat.icono}</span>
            <span className="categoria-nombre">{cat.nombre}</span>
          </button>
        ))}
      </div>

      {/* Modal de productos por categoría */}
      {mostrarModalProductos && (
        <div className="modal-overlay" onClick={() => setMostrarModalProductos(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{categorias.find(c => c.id === categoriaSeleccionada)?.nombre}</h2>
              <button className="close-btn" onClick={() => setMostrarModalProductos(false)}>✕</button>
            </div>
            <div className="productos-grid">
              {productosCategoria.length === 0 ? (
                <p>No hay productos en esta categoría</p>
              ) : (
                productosCategoria.map((producto) => (
                  <div key={producto.id} className="producto-card">
                    <div className="producto-info">
                      <h4>{producto.subcategoria || producto.nombre}</h4>
                      <p className="producto-precio">${producto.precio}</p>
                      <p className="producto-stock">Stock: {producto.cantidad}</p>
                    </div>
                    <button
                      className="agregar-btn"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={producto.cantidad <= 0}
                    >
                      ➕ Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Combos */}
      {mostrarModalCombos && (
        <div className="modal-overlay" onClick={() => setMostrarModalCombos(false)}>
          <div className="modal-content combos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍱 Combos Especiales</h2>
              <button className="close-btn" onClick={() => setMostrarModalCombos(false)}>✕</button>
            </div>
            <div className="combos-grid">
              {combos.length === 0 ? (
                <p>No hay combos disponibles</p>
              ) : (
                combos.map((combo) => (
                  <div key={combo.id} className="combo-card">
                    <div className="combo-icono">🍱</div>
                    <div className="combo-info">
                      <h4>{combo.nombre}</h4>
                      <p className="combo-descripcion">{combo.descripcion || "Combo especial"}</p>
                      <p className="combo-precio">${combo.precio}</p>
                    </div>
                    <button
                      className="agregar-combo-btn"
                      onClick={() => agregarComboAlCarrito(combo)}
                    >
                      ➕ Agregar Combo
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Carrito de compras */}
      <div className="carrito-container">
        <h2>🛒 Carrito de Compras</h2>
        {carrito.length === 0 ? (
          <p className="carrito-vacio">El carrito está vacío</p>
        ) : (
          <>
            <div className="carrito-items">
              {carrito.map((item, idx) => (
                <div key={idx} className="carrito-item">
                  <span className="carrito-nombre">
                    {item.esCombo && "🍱 "}{item.nombre}
                  </span>
                  <span className="carrito-cantidad">x{item.cantidad}</span>
                  <span className="carrito-precio">${item.precio}</span>
                  <span className="carrito-subtotal">${item.subtotal}</span>
                  <button className="carrito-eliminar" onClick={() => eliminarDelCarrito(idx)}>🗑️</button>
                </div>
              ))}
            </div>
            <div className="carrito-total">
              <strong>Total: ${totalCarrito}</strong>
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar Venta
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de venta exitosa */}
      {mostrarModalExito && ventaExitosa && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-content exito-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header exito-header">
              <FiCheckCircle className="exito-icono" />
              <h2>¡Venta Exitosa!</h2>
              <button className="close-btn" onClick={cerrarModalExito}>✕</button>
            </div>
            <div className="modal-body">
              <div className="venta-info">
                <p><strong>📍 Venta #:</strong> {ventaExitosa.id}</p>
                <p><strong>📅 Fecha:</strong> {ventaExitosa.fecha}</p>
                <p><strong>👤 Cajero:</strong> {usuario.nombre}</p>
              </div>
              
              <div className="detalle-venta">
                <h3>Detalle de la compra</h3>
                <table className="detalle-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaExitosa.productos.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.esCombo && "🍱 "}{item.nombre}</td>
                        <td>{item.cantidad}</td>
                        <td>${item.precio}</td>
                        <td>${item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="total-venta">
                <span>Total Pagado:</span>
                <strong>${ventaExitosa.total}</strong>
              </div>
              
              <div className="mensaje-agradecimiento">
                <p>🎉 ¡Gracias por tu compra!</p>
                <p className="mensaje-pequeno">Venta registrada correctamente en el sistema</p>
              </div>
              
              <button className="btn-cerrar-exito" onClick={cerrarModalExito}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cierre de sesión */}
      {mostrarModalCierre && (
        <div className="modal-overlay" onClick={cancelarCierre}>
          <div className="modal-content cierre-modal" onClick={(e) => e.stopPropagation()}>
            {!cerrando ? (
              <>
                <div className="modal-header">
                  <h2>🔓 Cerrar Sesión</h2>
                  <button className="close-btn" onClick={cancelarCierre}>✕</button>
                </div>
                <div className="modal-body">
                  <p className="cierre-mensaje">¿Estás seguro de que deseas cerrar sesión?</p>
                  <div className="cierre-buttons">
                    <button className="btn-cancelar" onClick={cancelarCierre}>Cancelar</button>
                    <button className="btn-confirmar" onClick={confirmarCierre}>Sí, cerrar sesión</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="modal-body cerrando">
                <div className="spinner"></div>
                <p>🔄 Cerrando sesión...</p>
                <p className="cerrando-mensaje">Por favor espera</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
