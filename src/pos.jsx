import React, { useState, useEffect } from "react";
import "./POS.css";
import { supabase } from "./supabaseClient";

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion }) {
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productosCategoria, setProductosCategoria] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);

  // Definir categorías con íconos y nombres
  const categorias = [
    { id: "deditos", nombre: "Deditos", icono: "🍢", color: "#f59e0b" },
    { id: "empanadas", nombre: "Empanadas", icono: "🥟", color: "#10b981" },
    { id: "medallones", nombre: "Medallones", icono: "🍔", color: "#ef4444" },
    { id: "bolitas", nombre: "Bolitas", icono: "🫘", color: "#8b5cf6" },
    { id: "carimañolas", nombre: "Mini Carimañolas", icono: "🥟", color: "#f97316" },
    { id: "pizzas", nombre: "Mini Pizzas", icono: "🍕", color: "#eab308" },
    { id: "hayacas", nombre: "Mini Hayacas", icono: "🌽", color: "#22c55e" }
  ];

  // Filtrar productos por categoría (usando la columna 'categoria' de tu inventario)
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
    // Aquí va tu lógica de registro de venta (ya la tienes)
    // ...
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <h1>🍔 Congelador Lucky - POS</h1>
        <div className="user-info">
          <span>👤 {usuario.nombre}</span>
          <button onClick={cerrarSesion} className="logout-btn">Cerrar Sesión</button>
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
            onClick={() => abrirCategoria(cat.id)}
            style={{ backgroundColor: cat.color }}
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
    </div>
  );
}

export default POS;
