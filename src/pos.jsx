import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiLogOut } from "react-icons/fi";
import "./POS.css";

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setRefreshTrigger }) {
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productosCategoria, setProductosCategoria] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Definir categorías con íconos y nombres
  const categorias = [
    { id: "deditos", nombre: "Deditos", icono: "🍢", color: "#d97706" },
    { id: "empanadas", nombre: "Empanadas", icono: "🥟", color: "#b45309" },
    { id: "medallones", nombre: "Medallones", icono: "🍔", color: "#9b2c2c" },
    { id: "bolitas", nombre: "Bolitas", icono: "🫘", color: "#854d0e" },
    { id: "carimañolas", nombre: "Mini Carimañolas", icono: "🥟", color: "#c2410c" },
    { id: "pizzas", nombre: "Mini Pizzas", icono: "🍕", color: "#b91c1c" },
    { id: "hayacas", nombre: "Mini Hayacas", icono: "🌽", color: "#a16207" }
  ];

  // Filtrar productos por categoría
  const abrirCategoria = (categoriaId) => {
    const productos = inventario.filter(item => 
      item.categoria?.toLowerCase() === categoriaId.toLowerCase() ||
      item.subcategoria?.toLowerCase().includes(categoriaId.toLowerCase())
    );
    setProductosCategoria(productos);
    setCategoriaSeleccionada(categoriaId);
    setMostrarModalProductos(true);
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const item = {
      id: producto.id,
      nombre: producto.subcategoria || producto.nombre,
      precio: producto.precio,
      cantidad: cantidad,
      subtotal: cantidad * producto.precio
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
      producto_id: item.id,
      cantidad: item.cantidad,
      total: item.subtotal
    }));

    try {
      const response = await axios.post(`${API_URL}/venta-carrito`, {
        cajero_id: usuario.id,
        productos: productosParaBackend
      });

      console.log("Respuesta exitosa:", response.data);
      alert(`✅ Venta registrada. ID: ${response.data.id_venta} - Total: $${response.data.total}`);
      
      setCarrito([]);
      if (response.data.inventario && actualizarInventario) {
        actualizarInventario(response.data.inventario);
      }
      if (setRefreshTrigger) setRefreshTrigger(prev => !prev);
      
    } catch (error) {
      console.error("Error al registrar venta del carrito:", error);
      if (error.response) {
        console.error("Detalle del error del backend:", error.response.data);
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

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <h3>🥟 Congelador Lucky - POS </h3>
        <div className="user-info">
          <span> 👤{usuario.nombre} </span>
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
                  <span className="carrito-nombre">{item.nombre}</span>
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
