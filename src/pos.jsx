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
  const [seleccionesEmpanadas, setSeleccionesEmpanadas] = useState([]); // 🔥 Ahora es un ARRAY
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false);

  // ===== IDs DE EMPANADAS =====
  const EMPANADA_IDS = [11, 12, 13, 33]; // Pollo, Carne, Hawaiana, Ranchera

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
    if (imageMap[nombreArchivo]) {
      return imageMap[nombreArchivo];
    }
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
    {
      id: "deditos",
      nombre: "Deditos",
      imagen: deditosImg,
      color: "#d97706"
    },
    {
      id: "empanadas",
      nombre: "Empanadas",
      imagen: empanadasImg,
      color: "#b45309"
    },
    {
      id: "otros",
      nombre: "Otros",
      imagen: otrosImg,
      color: "#4b5563"
    },
    {
      id: "combos",
      nombre: "Combos",
      imagen: combosImg,
      color: "#6b21a5"
    }
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

  // ===== FUNCIONES DEL CARRITO =====

  const agregarComboPersonalizado = (productosFinales) => {
    const carritoItems = productosFinales.map(p => {
      const producto = inventario.find(i => i.id === p.producto_id);
      return {
        id: p.producto_id,
        nombre: producto?.subcategoria || producto?.nombre || `Producto #${p.producto_id}`,
        precio: producto?.precio || 0,
        cantidad: p.cantidad,
        subtotal: p.cantidad * (producto?.precio || 0),
        esCombo: false,
      };
    });
    setCarrito(prev => [...prev, ...carritoItems]);
    setMostrarModalPersonalizar(false);
    setComboPersonalizando(null);
    setSeleccionesEmpanadas([]);
    setMostrarModalCombos(false);
  };

  const agregarComboAlCarrito = async (combo, cantidad = 1) => {
    try {
      const { data: detalles, error } = await supabase
        .from('combo_detalle')
        .select('producto_id, cantidad')
        .eq('combo_id', combo.id);
      if (error) throw error;

      const tieneEmpanadas = detalles.some(d => EMPANADA_IDS.includes(d.producto_id));

      if (tieneEmpanadas) {
        // 🔥 Inicializar ARRAY de selecciones
        const inicialSelecciones = detalles
          .filter(d => EMPANADA_IDS.includes(d.producto_id))
          .map(d => ({
            producto_id: d.producto_id,
            cantidad: 0
          }));
        setSeleccionesEmpanadas(inicialSelecciones);
        setComboPersonalizando({ combo, cantidad, productosActuales: detalles });
        setMostrarModalPersonalizar(true);
        console.log("🔍 Selecciones inicializadas:", inicialSelecciones);
      } else {
        const item = {
          id: combo.id,
          nombre: combo.nombre,
          precio: combo.precio,
          cantidad: cantidad,
          subtotal: cantidad * combo.precio,
          esCombo: true,
        };
        setCarrito(prev => [...prev, item]);
        setMostrarModalCombos(false);
      }
    } catch (err) {
      console.error('Error al agregar combo:', err);
      alert('Ocurrió un error al cargar el combo.');
    }
  };

  // 🔥 Función para cambiar sabor o cantidad (con ARRAY)
  const handleSaborChange = (index, field, value) => {
    setSeleccionesEmpanadas(prev => {
      const newArray = [...prev];
      newArray[index] = {
        ...newArray[index],
        [field]: field === 'producto_id' ? parseInt(value, 10) : Number(value)
      };
      console.log(`🔄 Cambio en índice ${index}:`, newArray[index]);
      console.log("📦 Estado completo:", newArray);
      return newArray;
    });
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

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
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

      {/* MODAL DE PRODUCTOS (omitido para brevedad, pero debe estar aquí) */}
      {mostrarModalProductos && (/* ... */)}

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

      {/* 🆕 MODAL DE PERSONALIZACIÓN (CON ARRAY) */}
      {mostrarModalPersonalizar && comboPersonalizando && (
        <div className="modal-overlay" onClick={() => setMostrarModalPersonalizar(false)}>
          <div className="modal-content personalizar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍱 Personalizar Combo</h2>
              <button className="close-btn" onClick={() => setMostrarModalPersonalizar(false)}>✕</button>
            </div>
            <div className="modal-body personalizar-body">
              <p className="personalizar-info">
                El combo <strong>{comboPersonalizando.combo.nombre}</strong> incluye empanadas. 
                Puedes elegir los sabores y las cantidades de cada uno.
              </p>

              {/* Resumen de cantidades */}
              {(() => {
                const totalEmpanadas = comboPersonalizando.productosActuales
                  .filter(p => EMPANADA_IDS.includes(p.producto_id))
                  .reduce((sum, p) => sum + p.cantidad, 0);
                const totalAsignado = seleccionesEmpanadas.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                const restante = totalEmpanadas - totalAsignado;

                return (
                  <div className="resumen-cantidades">
                    <span>Total empanadas: <strong>{totalEmpanadas}</strong></span>
                    <span>Asignadas: <strong>{totalAsignado}</strong></span>
                    <span>Restantes: <strong>{restante}</strong></span>
                  </div>
                );
              })()}

              {/* Productos fijos (no empanadas) */}
              <div className="sabores-grid">
                {comboPersonalizando.productosActuales.map((prod, idx) => {
                  if (!EMPANADA_IDS.includes(prod.producto_id)) {
                    const productoInfo = inventario.find(i => i.id === prod.producto_id);
                    return (
                      <div key={idx} className="sabor-item fijo">
                        <span className="sabor-nombre">{productoInfo?.subcategoria || 'Producto'}</span>
                        <span className="sabor-cantidad">x{prod.cantidad}</span>
                        <span className="sabor-fijo-badge">Fijo</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Empanadas personalizables */}
              <div className="sabores-grid empanadas-grid">
                <h4>Selecciona sabores y cantidades</h4>
                {seleccionesEmpanadas.map((seleccion, idx) => {
                  const saboresDisponibles = inventario.filter(i => EMPANADA_IDS.includes(i.id));
                  const prod = comboPersonalizando.productosActuales.find(
                    (p, i) => EMPANADA_IDS.includes(p.producto_id) && i === idx
                  );
                  if (!prod) return null;

                  return (
                    <div key={idx} className="sabor-item editable">
                      <span className="sabor-label">Empanada #{idx+1}</span>
                      <select
                        value={seleccion.producto_id}
                        onChange={(e) => handleSaborChange(idx, 'producto_id', e.target.value)}
                        className="sabor-select"
                      >
                        {saboresDisponibles.map(sabor => (
                          <option key={sabor.id} value={sabor.id}>
                            {sabor.subcategoria} - ${sabor.precio}
                          </option>
                        ))}
                      </select>
                      <div className="cantidad-control">
                        <button
                          className="cantidad-btn"
                          onClick={() => {
                            if (seleccion.cantidad > 0) {
                              handleSaborChange(idx, 'cantidad', seleccion.cantidad - 1);
                            }
                          }}
                          disabled={seleccion.cantidad <= 0}
                        >
                          −
                        </button>
                        <span className="cantidad-valor">{seleccion.cantidad}</span>
                        <button
                          className="cantidad-btn"
                          onClick={() => {
                            const totalEmpanadas = comboPersonalizando.productosActuales
                              .filter(p => EMPANADA_IDS.includes(p.producto_id))
                              .reduce((sum, p) => sum + p.cantidad, 0);
                            const totalAsignado = seleccionesEmpanadas.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                            if (totalAsignado < totalEmpanadas) {
                              handleSaborChange(idx, 'cantidad', seleccion.cantidad + 1);
                            }
                          }}
                          disabled={
                            (() => {
                              const totalEmpanadas = comboPersonalizando.productosActuales
                                .filter(p => EMPANADA_IDS.includes(p.producto_id))
                                .reduce((sum, p) => sum + p.cantidad, 0);
                              const totalAsignado = seleccionesEmpanadas.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                              return totalAsignado >= totalEmpanadas;
                            })()
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="sabor-max">/ {prod.cantidad}</span>
                    </div>
                  );
                })}
              </div>

              <button 
                className="btn-aplicar-personalizacion"
                onClick={() => {
                  // Validar que todas las empanadas estén asignadas
                  const totalEmpanadas = comboPersonalizando.productosActuales
                    .filter(p => EMPANADA_IDS.includes(p.producto_id))
                    .reduce((sum, p) => sum + p.cantidad, 0);
                  const totalAsignado = seleccionesEmpanadas.reduce((sum, s) => sum + (s.cantidad || 0), 0);
                  if (totalAsignado !== totalEmpanadas) {
                    alert(`Faltan ${totalEmpanadas - totalAsignado} empanadas por asignar.`);
                    return;
                  }
                  // Construir lista final
                  const productosFinales = comboPersonalizando.productosActuales.map((prod, idx) => {
                    if (EMPANADA_IDS.includes(prod.producto_id)) {
                      // Buscar la selección correspondiente
                      const sel = seleccionesEmpanadas.find((s, i) => i === idx) || { producto_id: prod.producto_id, cantidad: 0 };
                      return { ...prod, producto_id: sel.producto_id, cantidad: sel.cantidad };
                    }
                    return prod;
                  });
                  agregarComboPersonalizado(productosFinales);
                }}
              >
                ✅ Aplicar cambios y agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El resto del código (carrito, pagos, etc.) es el mismo, no lo repito para no alargar, pero está en el archivo original */}
      {/* ... */}

    </div>
  );
}

export default POS;
