import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiLogOut, FiCheckCircle } from "react-icons/fi";
import { supabase } from "./supabaseClient";
import "./POS.css";
import CashRegister from './CashRegister';
import ModalPago from './components/ModalPago';
import DespachosModal from './components/DespachosModal';
import { formatPrice } from './utils/formatPrice.js';

// Importar imágenes de categorías
import deditosImg from "./components/images/portada 2 deditos.jpg";
import empanadasImg from "./components/images/empanadas portada.jpg";
import otrosImg from "./components/images/portada de otros.jpg";
import combosImg from "./components/images/imagen de portada de combos.jpg";

// Importar logo
import logoImg from "./components/images/logo.jpeg";

// ============================================================
//  MAPA DE IMÁGENES DE PRODUCTOS (src/components/images/)
// ============================================================
const imageModules = import.meta.glob('./components/images/*.{jpeg,jpg,png,gif,webp}', { eager: true });
const imageMap = {};
Object.keys(imageModules).forEach((path) => {
  const fileName = path.split('/').pop();
  imageMap[fileName] = imageModules[path].default;
});

function POS({ usuario, inventario, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setRefreshTrigger }) {
  // ===== ESTADOS PRINCIPALES =====
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [productosCategoria, setProductosCategoria] = useState([]);
  const [combos, setCombos] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [mostrarModalCombos, setMostrarModalCombos] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [datosPagoConfirmacion, setDatosPagoConfirmacion] = useState(null);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [mostrarCuadre, setMostrarCuadre] = useState(false);
  const [mostrarDespachos, setMostrarDespachos] = useState(false);

  // ===== ESTADOS PARA PERSONALIZACIÓN DE COMBOS =====
  const [comboPersonalizando, setComboPersonalizando] = useState(null);
  const [asignaciones, setAsignaciones] = useState({});
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false);

  // ===== IDs DE EMPANADAS =====
  const EMPANADA_IDS = [11, 12, 13, 33];

  // ===== MODO OSCURO =====
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const API_URL = import.meta.env.VITE_API_URL;

  // ===== FUNCIÓN PARA OBTENER IMAGEN DEL PRODUCTO =====
  const getImagenProducto = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    if (imageMap[nombreArchivo]) return imageMap[nombreArchivo];
    console.warn(`⚠️ Imagen no encontrada: ${nombreArchivo}`);
    return null;
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const { data, error } = await supabase.from("combos").select("*");
      if (error) throw error;
      setCombos(data || []);
    } catch (err) {
      console.error("Error cargando combos:", err);
    }
  };

  // ===== CATEGORÍAS =====
  const categorias = [
    { id: "deditos", nombre: "Deditos", imagen: deditosImg, color: "#d97706" },
    { id: "empanadas", nombre: "Empanadas", imagen: empanadasImg, color: "#b45309" },
    { id: "otros", nombre: "Otros", imagen: otrosImg, color: "#4b5563" },
    { id: "combos", nombre: "Combos", imagen: combosImg, color: "#6b21a5" }
  ];

  const abrirCategoria = (categoriaId) => {
    if (categoriaId === "combos") {
      setMostrarModalCombos(true);
      return;
    }
    const nombreCategoria = categoriaId === "otros" ? "Otros" : categoriaId;
    const productos = inventario.filter(item =>
      item.categoria?.toLowerCase() === nombreCategoria.toLowerCase()
    );
    setProductosCategoria(productos);
    setCategoriaSeleccionada(categoriaId);
    setMostrarModalProductos(true);
  };

  // ============================================================
  // FUNCIONES DE PERSONALIZACIÓN (CORREGIDAS)
  // ============================================================

  // Obtener unidades por paquete (movida antes de agruparPorCategoria)
  const getUnidadesPorPaquete = (productoId) => {
    const p = inventario.find(i => i.id === productoId);
    if (p) {
      const match = p.subcategoria?.match(/x(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return 1;
  };

  // Agrupar productos del combo por categoría
  const agruparPorCategoria = (detalles) => {
    const grupos = {};
    detalles.forEach(d => {
      const producto = inventario.find(i => i.id === d.producto_id);
      if (!producto) return;
      const categoria = producto.categoria || 'Sin categoría';
      if (!grupos[categoria]) {
        grupos[categoria] = {
          requerido: 0,
          productosOriginales: []
        };
      }
      // ✅ CORRECCIÓN: multiplicar por unidades por paquete
      const unidadesPorPaquete = getUnidadesPorPaquete(d.producto_id);
      grupos[categoria].requerido += d.cantidad * unidadesPorPaquete;
      grupos[categoria].productosOriginales.push(d);
    });
    return grupos;
  };

  // Inicializar asignaciones con todos los paquetes disponibles de cada categoría
  const inicializarAsignaciones = (grupos) => {
    const asignacionesIniciales = {};
    Object.keys(grupos).forEach(categoria => {
      const data = grupos[categoria];
      // Obtener todos los productos de esa categoría con stock > 0
      const paquetesDisponibles = inventario
        .filter(i => i.categoria === categoria && i.cantidad > 0)
        .map(i => ({ paquete_id: i.id, unidades: 0, max: i.cantidad }));

      if (paquetesDisponibles.length === 0) {
        paquetesDisponibles.push({ paquete_id: 0, unidades: 0, max: 0 });
      }

      asignacionesIniciales[categoria] = {
        requerido: data.requerido,
        productosOriginales: data.productosOriginales,
        asignaciones: paquetesDisponibles
      };
    });
    setAsignaciones(asignacionesIniciales);
  };

  // Calcular total asignado en UNIDADES reales
  const getTotalAsignado = (categoria) => {
    const data = asignaciones[categoria];
    if (!data) return 0;
    let total = 0;
    data.asignaciones.forEach(a => {
      if (a.paquete_id === 0) return;
      const producto = inventario.find(i => i.id === a.paquete_id);
      const unidadesPorPaquete = producto ? getUnidadesPorPaquete(a.paquete_id) : 1;
      total += a.unidades * unidadesPorPaquete;
    });
    return total;
  };

  // Manejar cambio de unidades asignadas a un paquete
  const handleAsignacionChange = (categoria, paqueteId, delta) => {
    setAsignaciones(prev => {
      const grupo = prev[categoria];
      if (!grupo) return prev;

      const nuevasAsignaciones = grupo.asignaciones.map(a => {
        if (a.paquete_id === paqueteId) {
          const nuevasUnidades = Math.max(0, a.unidades + delta);
          const maxUnidades = a.max;
          return { ...a, unidades: Math.min(nuevasUnidades, maxUnidades) };
        }
        return a;
      });

      // Calcular total asignado en UNIDADES reales
      let totalAsignado = 0;
      nuevasAsignaciones.forEach(a => {
        if (a.paquete_id === 0) return;
        const producto = inventario.find(i => i.id === a.paquete_id);
        const unidadesPorPaquete = producto ? getUnidadesPorPaquete(a.paquete_id) : 1;
        totalAsignado += a.unidades * unidadesPorPaquete;
      });

      if (totalAsignado > grupo.requerido) return prev;

      return {
        ...prev,
        [categoria]: {
          ...grupo,
          asignaciones: nuevasAsignaciones
        }
      };
    });
  };

  // Obtener nombre de categoría
  const getCategoriaNombre = (categoria) => {
    const nombres = {
      'deditos': 'Deditos',
      'empanadas': 'Empanadas',
      'Otros': 'Otros'
    };
    return nombres[categoria] || categoria;
  };

  // Obtener el nombre del producto
  const getProductoNombre = (productoId) => {
    const p = inventario.find(i => i.id === productoId);
    return p?.subcategoria || p?.nombre || `Producto #${productoId}`;
  };

  // ============================================================
  // FUNCIONES DEL CARRITO
  // ============================================================

  const agregarComboPersonalizado = () => {
    const categoriasKeys = Object.keys(asignaciones);
    const productosFinales = [];

    for (const categoria of categoriasKeys) {
      const data = asignaciones[categoria];
      let totalAsignado = 0;
      data.asignaciones.forEach(a => {
        if (a.paquete_id === 0) return;
        const producto = inventario.find(i => i.id === a.paquete_id);
        const unidadesPorPaquete = producto ? getUnidadesPorPaquete(a.paquete_id) : 1;
        totalAsignado += a.unidades * unidadesPorPaquete;
      });
      const requerido = data.requerido;

      if (totalAsignado !== requerido) {
        alert(`Faltan ${requerido - totalAsignado} unidades de ${getCategoriaNombre(categoria)}`);
        return;
      }

      data.asignaciones.forEach(asignacion => {
        if (asignacion.unidades > 0 && asignacion.paquete_id !== 0) {
          productosFinales.push({
            producto_id: asignacion.paquete_id,
            cantidad: asignacion.unidades,
            precio: 0
          });
        }
      });
    }

    if (productosFinales.length === 0) {
      alert('Debes asignar al menos un producto al combo.');
      return;
    }

    const combo = comboPersonalizando.combo;
    const cantidad = comboPersonalizando.cantidad;

    const comboItem = {
      id: combo.id,
      nombre: combo.nombre,
      precio: combo.precio,
      cantidad: cantidad,
      subtotal: cantidad * combo.precio,
      esCombo: true,
    };

    const itemsPersonalizados = productosFinales.map(p => {
      const productoInfo = inventario.find(i => i.id === p.producto_id);
      return {
        id: p.producto_id,
        nombre: productoInfo?.subcategoria || productoInfo?.nombre || `Producto #${p.producto_id}`,
        precio: 0,
        cantidad: p.cantidad,
        subtotal: 0,
        esCombo: false,
        incluido: true,
      };
    });

    setCarrito(prev => [...prev, comboItem, ...itemsPersonalizados]);
    setMostrarModalPersonalizar(false);
    setComboPersonalizando(null);
    setAsignaciones({});
    setMostrarModalCombos(false);
  };

  const agregarComboAlCarrito = async (combo, cantidad = 1) => {
    try {
      const { data: detalles, error } = await supabase
        .from('combo_detalle')
        .select('producto_id, cantidad')
        .eq('combo_id', combo.id);
      if (error) throw error;

      const grupos = agruparPorCategoria(detalles);
      setComboPersonalizando({ combo, cantidad, productosActuales: detalles });
      inicializarAsignaciones(grupos);
      setMostrarModalPersonalizar(true);

    } catch (err) {
      console.error('Error al agregar combo:', err);
      alert('Ocurrió un error al cargar el combo.');
    }
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

  const actualizarCantidadCarrito = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    const nuevoCarrito = [...carrito];
    const item = nuevoCarrito[index];
    item.cantidad = nuevaCantidad;
    item.subtotal = nuevaCantidad * item.precio;
    setCarrito(nuevoCarrito);
  };

  // ===== VENTA =====
  const registrarVentaFinal = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    setMostrarModalPago(true);
  };

  const confirmarPago = (datosPago) => {
    setMostrarModalPago(false);
    setDatosPagoConfirmacion(datosPago);
    setMostrarConfirmacion(true);
  };

  const ejecutarPago = async () => {
    const datosPago = datosPagoConfirmacion;
    if (!datosPago) return;

    setMostrarConfirmacion(false);

    const productosParaBackend = carrito.map(item => ({
      producto_id: item.esCombo ? null : item.id,
      combo_id: item.esCombo ? item.id : null,
      cantidad: item.cantidad,
      total: item.subtotal
    }));

    const carritoCopy = [...carrito];
    const totalVenta = carritoCopy.reduce((sum, item) => sum + item.subtotal, 0);

    try {
      const response = await axios.post(`${API_URL}/venta-carrito`, {
        cajero_id: usuario.id,
        productos: productosParaBackend,
        metodo_pago: datosPago.metodo_pago,
        cambio: datosPago.cambio,
        monto_efectivo: datosPago.monto_efectivo || 0,
        monto_transferencia: datosPago.monto_transferencia || 0
      });

      console.log("Respuesta exitosa:", response.data);

      const productosMostrados = carritoCopy.map(item => ({
        nombre: item.esCombo ? `🍱 ${item.nombre}` : item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal,
        esCombo: item.esCombo
      }));

      setVentaExitosa({
        id: response.data.id_venta,
        productos: productosMostrados,
        total: totalVenta,
        fecha: new Date().toLocaleString(),
        cajero: usuario.nombre,
        metodo_pago: datosPago.metodo_pago,
        cambio: datosPago.cambio,
        monto_efectivo: datosPago.monto_efectivo || 0,
        monto_transferencia: datosPago.monto_transferencia || 0
      });
      setMostrarModalExito(true);

      setCarrito([]);

      if (response.data.inventario && actualizarInventario) {
        actualizarInventario(false);
      }

      if (setRefreshTrigger) {
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 100);
      }

      setDatosPagoConfirmacion(null);

    } catch (error) {
      console.error("Error al registrar venta del carrito:", error);
      if (error.response) {
        alert(`Error ${error.response.status}: ${error.response.data.detail || JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        alert("No se recibió respuesta del servidor. Revisa que el backend esté activo.");
      } else {
        alert("Error al preparar la solicitud: " + error.message);
      }
      setMostrarModalPago(true);
    }
  };

  // ===== CIERRE DE SESIÓN =====
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
    setTimeout(() => {
      setVentaExitosa(null);
    }, 300);
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="pos-container">
      {/* HEADER CON LOGO */}
      <div className="pos-header">
        <div className="logo-area">
          <img src={logoImg} alt="Congelados Lucky" className="logo-img" />
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
          <button onClick={() => setMostrarCuadre(true)} className="cuadre-btn">
            💰 Cuadre
          </button>
          <button onClick={handleCerrarSesion} className="logout-btn">
            <FiLogOut className="logout-icon" /> Salir
          </button>
          <button onClick={() => setMostrarDespachos(true)} className="despachos-btn">
            📥 Despachos
          </button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}

      {/* GRID DE CATEGORÍAS CON IMÁGENES */}
      <div className="categorias-grid">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            className="categoria-card"
            data-categoria={cat.id}
            onClick={() => abrirCategoria(cat.id)}
            style={{
              backgroundImage: `url(${cat.imagen})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: cat.color,
            }}
          >
            <div className="categoria-overlay"></div>
            <span className="categoria-nombre">{cat.nombre}</span>
          </button>
        ))}
      </div>

      {/* MODAL DE PRODUCTOS */}
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
                    <div className="producto-imagen">
                      {producto.imagen_url ? (
                        <img
                          src={getImagenProducto(producto.imagen_url)}
                          alt={producto.subcategoria || producto.nombre}
                        />
                      ) : (
                        <div className="producto-sin-imagen">📷</div>
                      )}
                    </div>
                    <div className="producto-info">
                      <h4>{producto.subcategoria || producto.nombre}</h4>
                      <p className="producto-precio">{formatPrice(producto.precio)}</p>
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

      {/* MODAL DE COMBOS */}
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
                    <div className="combo-imagen">
                      {combo.imagen_url ? (
                        <img
                          src={getImagenProducto(combo.imagen_url)}
                          alt={combo.nombre}
                        />
                      ) : (
                        <div className="combo-sin-imagen">🍱</div>
                      )}
                    </div>
                    <div className="combo-info">
                      <h4>{combo.nombre}</h4>
                      <p className="combo-descripcion">{combo.descripcion || "Combo especial"}</p>
                      <p className="combo-precio">{formatPrice(combo.precio)}</p>
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

      {/* 🆕 MODAL DE PERSONALIZACIÓN DE COMBO (CORREGIDO) */}
      {mostrarModalPersonalizar && comboPersonalizando && (
        <div className="modal-overlay" onClick={() => setMostrarModalPersonalizar(false)}>
          <div className="modal-content personalizar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍱 Personalizar Combo</h2>
              <button className="close-btn" onClick={() => setMostrarModalPersonalizar(false)}>✕</button>
            </div>
            <div className="modal-body personalizar-body">
              <p className="personalizar-info">
                El combo <strong>{comboPersonalizando.combo.nombre}</strong> requiere las siguientes unidades.
                Puedes elegir cómo distribuir las unidades entre los paquetes disponibles de cada categoría.
                <br />
                <span className="nota-precio">El precio del combo se mantiene fijo.</span>
              </p>

              {/* Categorías del combo */}
              {Object.keys(asignaciones).map((categoria) => {
                const data = asignaciones[categoria];
                const totalAsignado = getTotalAsignado(categoria);
                const requerido = data.requerido;
                const nombreCategoria = getCategoriaNombre(categoria);

                return (
                  <div key={categoria} className="categoria-asignacion">
                    <h3 className="categoria-titulo">{nombreCategoria}</h3>
                    <div className="categoria-resumen">
                      <span>Requerido: <strong>{requerido}</strong> unidades</span>
                      <span>Asignado: <strong>{totalAsignado}</strong></span>
                      {totalAsignado === requerido && <span className="completado-badge">✅ Completado</span>}
                      {totalAsignado < requerido && <span className="pendiente-badge">⚠️ Faltan {requerido - totalAsignado}</span>}
                    </div>

                    <div className="asignacion-paquetes">
                      {data.asignaciones.map((asignacion) => {
                        const paqueteInfo = inventario.find(i => i.id === asignacion.paquete_id);
                        const nombrePaquete = paqueteInfo?.subcategoria || paqueteInfo?.nombre || 'Sin stock';
                        const stockDisponible = asignacion.max;
                        const unidadesPorPaquete = getUnidadesPorPaquete(asignacion.paquete_id);

                        return (
                          <div key={asignacion.paquete_id} className="asignacion-item">
                            <span className="paquete-nombre">
                              {nombrePaquete} (Stock: {stockDisponible})
                            </span>
                            <div className="asignacion-controles">
                              <button
                                className="cantidad-btn"
                                onClick={() => handleAsignacionChange(categoria, asignacion.paquete_id, -1)}
                                disabled={asignacion.unidades <= 0 || asignacion.paquete_id === 0}
                              >
                                −
                              </button>
                              <span className="asignacion-valor">{asignacion.unidades}</span>
                              <button
                                className="cantidad-btn"
                                onClick={() => handleAsignacionChange(categoria, asignacion.paquete_id, 1)}
                                disabled={totalAsignado >= requerido || asignacion.unidades >= stockDisponible || asignacion.paquete_id === 0}
                              >
                                +
                              </button>
                              <span className="unidades-por-paquete">({unidadesPorPaquete} uds/paq)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button 
                className="btn-aplicar-personalizacion"
                onClick={agregarComboPersonalizado}
              >
                ✅ Aplicar cambios y agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO DE COMPRAS */}
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
                    {item.esCombo && <span className="combo-badge">Combo</span>}
                    {item.incluido && <span className="incluido-badge">(Incluido)</span>}
                  </span>
                  <div className="carrito-cantidad-control">
                    <button
                      className="cantidad-btn"
                      onClick={() => actualizarCantidadCarrito(idx, item.cantidad - 1)}
                      disabled={item.cantidad <= 1 || item.incluido}
                    >
                      −
                    </button>
                    <span className="carrito-cantidad">{item.cantidad}</span>
                    <button
                      className="cantidad-btn"
                      onClick={() => actualizarCantidadCarrito(idx, item.cantidad + 1)}
                      disabled={item.incluido}
                    >
                      +
                    </button>
                  </div>
                  <span className="carrito-precio">{formatPrice(item.precio)}</span>
                  <span className="carrito-subtotal">{formatPrice(item.subtotal)}</span>
                  <button className="carrito-eliminar" onClick={() => eliminarDelCarrito(idx)}>🗑️</button>
                </div>
              ))}
            </div>
            <div className="carrito-total">
              <strong>Total: {formatPrice(totalCarrito)}</strong>
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar Venta
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE VENTA EXITOSA */}
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
                <p><strong>👤 Cajero:</strong> {ventaExitosa.cajero}</p>
                <p><strong>💳 Método de pago:</strong> {ventaExitosa.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
                {ventaExitosa.cambio > 0 && (
                  <p><strong>🔄 Cambio:</strong> {formatPrice(ventaExitosa.cambio)}</p>
                )}
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
                      <tr key={idx} className={item.esCombo ? "combo-row" : ""}>
                        <td className={item.esCombo ? "combo-producto" : ""}>
                          {item.esCombo && "🍱 "}{item.nombre}
                          {item.incluido && " (incluido)"}
                        </td>
                        <td>{item.cantidad}</td>
                        <td>{formatPrice(item.precio)}</td>
                        <td className="subtotal-cell">{formatPrice(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="3"><strong>Total</strong></td>
                      <td className="total-cell">{formatPrice(ventaExitosa.total)}</td>
                    </tr>
                  </tfoot>
                </table>
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

      {/* MODAL DE PAGO */}
      {mostrarModalPago && (
        <ModalPago
          total={totalCarrito}
          usuario={usuario}
          onConfirm={confirmarPago}
          onCancel={() => setMostrarModalPago(false)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE PAGO */}
      {mostrarConfirmacion && datosPagoConfirmacion && (
        <div className="modal-overlay" onClick={() => {
          setMostrarConfirmacion(false);
          setDatosPagoConfirmacion(null);
          setMostrarModalPago(true);
        }}>
          <div className="modal-content confirmacion-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header confirmacion-header">
              <h2>⚠️ Confirmar Pago</h2>
              <button className="close-btn" onClick={() => {
                setMostrarConfirmacion(false);
                setDatosPagoConfirmacion(null);
                setMostrarModalPago(true);
              }}>✕</button>
            </div>
            <div className="modal-body">
              <p className="confirmacion-mensaje">
                ¿Estás seguro de confirmar el pago de los productos seleccionados?
              </p>
              <div className="confirmacion-resumen">
                <p><strong>Total:</strong> {formatPrice(totalCarrito)}</p>
                <p><strong>Método de pago:</strong> {datosPagoConfirmacion.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
                {datosPagoConfirmacion.metodo_pago === 'efectivo' && (
                  <p><strong>Cambio:</strong> {formatPrice(datosPagoConfirmacion.cambio)}</p>
                )}
              </div>
              <div className="confirmacion-buttons">
                <button
                  className="btn-cancelar-confirmacion"
                  onClick={() => {
                    setMostrarConfirmacion(false);
                    setDatosPagoConfirmacion(null);
                    setMostrarModalPago(true);
                  }}
                >
                  No
                </button>
                <button
                  className="btn-aceptar-confirmacion"
                  onClick={ejecutarPago}
                >
                  Sí, confirmar pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CUADRE DE CAJA */}
      {mostrarCuadre && (
        <div className="modal-overlay" onClick={() => setMostrarCuadre(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CashRegister
              usuario={usuario}
              inventario={inventario}
              onClose={() => setMostrarCuadre(false)}
            />
          </div>
        </div>
      )}

      {mostrarDespachos && (
        <DespachosModal
          onClose={() => setMostrarDespachos(false)}
          inventario={inventario}
        />
      )}

      {/* MODAL DE CIERRE DE SESIÓN */}
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
