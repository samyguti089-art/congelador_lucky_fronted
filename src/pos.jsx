import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiLogOut,
  FiCheckCircle,
  FiClipboard,
  FiMoon,
  FiSun,
  FiTrash2,
  FiTruck,
  FiUser,
  FiVolume2,
  FiVolumeX,
  FiSend,
  FiMail,
  FiPrinter,
  FiGift
} from "react-icons/fi";
import { supabase } from "./supabaseClient";
import "./POS.css";
import CashRegister from './CashRegister';
import ModalPago from './components/ModalPago';
import DespachosModal from './components/DespachosModal';
import BaseDelDia from './components/BaseDelDia';
import { formatPrice } from './utils/formatPrice.js';
import { playBeep, playChaChing, launchConfetti } from './utils/posEffects';
import { STORE_NAME, STORE_TITLE_UPPER, POS_BADGE_TEXT } from './utils/storeConfig';

import deditosImg from "./components/images/portada 2 deditos.jpg";
import empanadasImg from "./components/images/empanadas portada.jpg";
import otrosImg from "./components/images/portada de otros.jpg";
import combosImg from "./components/images/imagen de portada de combos.jpg";
import logoImg from "./components/images/logo.jpeg";

// ============================================================
//  MAPA DE IMÁGENES
// ============================================================
const imageModules = import.meta.glob('./components/images/*.{jpeg,jpg,png,gif,webp}', { eager: true });
const imageMap = {};
Object.keys(imageModules).forEach((path) => {
  const fileName = path.split('/').pop();
  imageMap[fileName] = imageModules[path].default;
});

// ============================================================
//  CONFIGURACIÓN DE PROMOCIÓN DE OBSEQUIOS MAYORISTAS
// ============================================================
const MONTO_META_OBSEQUIO = 100000;
const PRECIO_REF_OBSEQUIO = 6000;
const ESCALA_OBSEQUIOS = Array.from({ length: 10 }, (_, idx) => {
  const nivel = idx + 1;
  return {
    venta: nivel * MONTO_META_OBSEQUIO,
    bandejas: nivel,
    descripcion: `${nivel} ${nivel === 1 ? 'BANDEJA' : 'BANDEJAS'} DE 20 UNIDADES DEDITOS`
  };
});

function POS({ usuario, inventario, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setRefreshTrigger }) {
  // ===== ESTADOS PRINCIPALES =====
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [combos, setCombos] = useState([]);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [mostrarModalCombos, setMostrarModalCombos] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [datosPagoConfirmacion, setDatosPagoConfirmacion] = useState(null);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [mostrarCuadre, setMostrarCuadre] = useState(false);
  const [mostrarDespachos, setMostrarDespachos] = useState(false);
  const [mostrarTablaObsequios, setMostrarTablaObsequios] = useState(false);
  const [entregarObsequio, setEntregarObsequio] = useState(true);

  // ===== COMBOS SIMPLIFICADOS =====
  const [comboEmpanadas, setComboEmpanadas] = useState(null);
  const [mostrarModalEmpanadas, setMostrarModalEmpanadas] = useState(false);
  const [seleccionEmpanadas, setSeleccionEmpanadas] = useState({});

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

  // ===== SWITCH DE SONIDO =====
  const [sonidoActivo, setSonidoActivo] = useState(() => {
    const saved = localStorage.getItem('sonidoActivo');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSonido = () => {
    setSonidoActivo(prev => {
      const nuevo = !prev;
      localStorage.setItem('sonidoActivo', JSON.stringify(nuevo));
      return nuevo;
    });
  };

  const API_URL = import.meta.env.VITE_API_URL;

  const getImagenProducto = (nombreArchivo) => {
    if (!nombreArchivo) return null;
    if (imageMap[nombreArchivo]) return imageMap[nombreArchivo];
    return null;
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from("combos").select("*");
      if (error) throw error;
      setCombos(data || []);
    } catch (err) {
      console.error("Error cargando combos:", err);
    }
  };

  // Categorías fijas
  const categorias = [
    { id: "deditos", nombre: "Deditos", imagen: deditosImg, color: "#f87171" },
    { id: "empanadas", nombre: "Empanadas", imagen: empanadasImg, color: "#60a5fa" },
    { id: "otros", nombre: "Otros", imagen: otrosImg, color: "#fbbf24" },
    { id: "combos", nombre: "Combos", imagen: combosImg, color: "#34d399" },
  ];

  const productosCategoria = categoriaSeleccionada && categoriaSeleccionada !== "combos"
    ? inventario.filter(
        (p) => p.categoria && p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase()
      )
    : [];

  const abrirCategoria = (categoriaId) => {
    setCategoriaSeleccionada(categoriaId);
    if (categoriaId === "combos") {
      setMostrarModalCombos(true);
    } else {
      setMostrarModalProductos(true);
    }
  };

  // Helper para unidades por paquete de empanadas
  const getUnidadesPorPaquete = (productoId) => {
    const prod = inventario.find(i => i.id === productoId);
    const subcat = (prod?.subcategoria || prod?.nombre || '').toLowerCase();
    if (subcat.includes('x10') || subcat.includes('10')) return 10;
    if (subcat.includes('x5') || subcat.includes('5')) return 5;
    if (subcat.includes('x8') || subcat.includes('8')) return 8;
    if (subcat.includes('x20') || subcat.includes('20')) return 20;
    return 10;
  };

  // ===== IDENTIFICAR PRODUCTO DE OBSEQUIO (BANDEJA DEDITOS X20) =====
  const productoObsequio = inventario.find((p) => {
    const texto = `${p.subcategoria || ''} ${p.nombre || ''}`.toLowerCase();
    return (
      (texto.includes('deditos x20') || texto.includes('dedito x20') || texto.includes('tradicional x20')) &&
      !texto.includes('mini') &&
      !texto.includes('bocadillo')
    );
  }) || inventario.find((p) => p.id === 9) || null;

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUnidadesCarrito = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  // Cálculo automático de obsequios por cada $100,000
  const obsequiosGanados = Math.floor(totalCarrito / MONTO_META_OBSEQUIO);
  const restoMetaObsequio = totalCarrito % MONTO_META_OBSEQUIO;
  const faltaSiguienteObsequio = MONTO_META_OBSEQUIO - restoMetaObsequio;
  const porcentajeMetaObsequio = Math.min(100, Math.round((restoMetaObsequio / MONTO_META_OBSEQUIO) * 100));

  const deditos20EnCarrito = productoObsequio
    ? carrito
        .filter((item) => item.id === productoObsequio.id && !item.esPrecioCombo && !item.esCombo)
        .reduce((sum, item) => sum + (item.cantidad || 0), 0)
    : 0;

  const stockDisponibleObsequio = productoObsequio
    ? Math.max(0, Math.floor((Number(productoObsequio.cantidad) || 0) - deditos20EnCarrito))
    : obsequiosGanados;

  const cantidadObsequioEfectiva =
    obsequiosGanados > 0 && entregarObsequio
      ? (productoObsequio ? Math.min(obsequiosGanados, stockDisponibleObsequio) : obsequiosGanados)
      : 0;

  // ===== COMBOS =====
  const agregarComboAlCarrito = async (combo, cantidad = 1) => {
    playBeep();
    try {
      const { data: detalles, error } = await supabase
        .from('combo_detalle')
        .select('producto_id, cantidad')
        .eq('combo_id', combo.id);
      if (error) throw error;

      const empanadas = [];
      const fijos = [];

      for (const d of detalles) {
        const prod = inventario.find(i => i.id === d.producto_id);
        if (!prod) continue;
        if (prod.categoria?.toLowerCase() === 'empanadas') {
          empanadas.push({ ...d, unidades_por_paquete: getUnidadesPorPaquete(d.producto_id) });
        } else {
          fijos.push(d);
        }
      }

      const itemsFijos = fijos.map(d => {
        const prod = inventario.find(i => i.id === d.producto_id);
        return {
          id: d.producto_id,
          nombre: prod?.subcategoria || prod?.nombre || `Producto #${d.producto_id}`,
          precio: 0,
          cantidad: d.cantidad,
          subtotal: 0,
          imagen_url: prod?.imagen_url,
          esCombo: false,
          incluido: true,
        };
      });

      if (empanadas.length > 0) {
        const requerido = empanadas.reduce((sum, e) => sum + e.cantidad * e.unidades_por_paquete, 0);
        const productosEmpanadas = inventario.filter(
          i => i.categoria?.toLowerCase() === 'empanadas' && i.cantidad > 0
        );
        setComboEmpanadas({ combo, cantidad, requerido, productosEmpanadas, itemsFijos });
        setSeleccionEmpanadas({});
        setMostrarModalEmpanadas(true);
      } else {
        const comboItem = {
          id: `precio-combo-${combo.id}`,
          nombre: combo.nombre,
          precio: combo.precio,
          cantidad,
          subtotal: cantidad * combo.precio,
          imagen_url: combo.imagen_url,
          esCombo: true,
          esPrecioCombo: true,
        };
        setCarrito(prev => [...prev, comboItem, ...itemsFijos]);
      }
    } catch (err) {
      console.error('Error al agregar combo:', err);
      alert('Ocurrió un error al cargar el combo.');
    }
  };

  const handleEmpanadaChange = (productoId, delta) => {
    playBeep();
    setSeleccionEmpanadas(prev => {
      const actual = prev[productoId] || 0;
      const nuevo = Math.max(0, actual + delta);
      const prod = inventario.find(i => i.id === productoId);
      const maxPaquetes = prod ? Math.floor(prod.cantidad) : 0;
      const limitado = Math.min(nuevo, maxPaquetes);
      const totalAsignado = Object.entries({ ...prev, [productoId]: limitado }).reduce((sum, [id, cant]) => {
        return sum + cant * getUnidadesPorPaquete(parseInt(id));
      }, 0);
      if (totalAsignado > comboEmpanadas.requerido) return prev;
      return { ...prev, [productoId]: limitado };
    });
  };

  const confirmarSeleccionEmpanadas = () => {
    playBeep();
    const { combo, cantidad, requerido, productosEmpanadas, itemsFijos } = comboEmpanadas;
    let totalAsignado = 0;
    const itemsEmpanadas = [];
    for (const prod of productosEmpanadas) {
      const cant = seleccionEmpanadas[prod.id] || 0;
      if (cant > 0) {
        totalAsignado += cant * getUnidadesPorPaquete(prod.id);
        itemsEmpanadas.push({
          id: prod.id,
          nombre: prod.subcategoria || prod.nombre,
          precio: 0,
          cantidad: cant,
          subtotal: 0,
          imagen_url: prod.imagen_url,
          esCombo: false,
          incluido: true,
        });
      }
    }
    if (totalAsignado !== requerido) {
      alert(`Debes seleccionar exactamente ${requerido} unidades de empanadas (faltan ${requerido - totalAsignado}).`);
      return;
    }

    const comboItem = {
      id: `precio-combo-${combo.id}`,
      nombre: combo.nombre,
      precio: combo.precio,
      cantidad,
      subtotal: cantidad * combo.precio,
      imagen_url: combo.imagen_url,
      esCombo: true,
      esPrecioCombo: true,
    };

    setCarrito(prev => [...prev, comboItem, ...itemsFijos, ...itemsEmpanadas]);
    setMostrarModalEmpanadas(false);
    setComboEmpanadas(null);
    setSeleccionEmpanadas({});
  };

  // ===== CARRITO =====
  const agregarAlCarrito = (producto, cantidad = 1) => {
    playBeep();
    const item = {
      id: producto.id,
      nombre: producto.subcategoria || producto.nombre,
      precio: producto.precio,
      cantidad: cantidad,
      subtotal: cantidad * producto.precio,
      imagen_url: producto.imagen_url,
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

    const productosParaBackend = carrito.map(item => {
      if (item.esPrecioCombo) {
        return {
          producto_id: null,
          combo_id: null,
          cantidad: item.cantidad,
          total: item.subtotal,
          descripcion: item.nombre
        };
      } else if (item.esCombo) {
        return {
          producto_id: null,
          combo_id: item.id,
          cantidad: item.cantidad,
          total: item.subtotal
        };
      } else {
        return {
          producto_id: item.id,
          combo_id: null,
          cantidad: item.cantidad,
          total: item.subtotal
        };
      }
    });

    // Integrar obsequios por volumen ($0 cobrado, descuenta stock real en inventario y Kardex)
    const obsequiosParaRegistrar = cantidadObsequioEfectiva;
    if (obsequiosParaRegistrar > 0) {
      productosParaBackend.push({
        producto_id: productoObsequio ? productoObsequio.id : null,
        combo_id: null,
        cantidad: obsequiosParaRegistrar,
        total: 0,
        descripcion: `OBSEQUIO: ${obsequiosParaRegistrar}x Bandeja Deditos x20`
      });
    }

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

      const productosMostrados = carritoCopy.map(item => ({
        nombre: item.esCombo ? `Combo: ${item.nombre}` : item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal,
        esCombo: item.esCombo,
        incluido: item.incluido,
        esObsequio: false
      }));

      if (obsequiosParaRegistrar > 0) {
        productosMostrados.push({
          nombre: 'Bandeja Deditos x20 (OBSEQUIO)',
          cantidad: obsequiosParaRegistrar,
          precio: 0,
          subtotal: 0,
          esCombo: false,
          incluido: false,
          esObsequio: true
        });
      }

      setVentaExitosa({
        id: response.data.id_venta,
        productos: productosMostrados,
        obsequios: obsequiosParaRegistrar,
        total: totalVenta,
        fecha: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
        cajero: usuario.nombre,
        metodo_pago: datosPago.metodo_pago,
        cambio: datosPago.cambio,
        monto_efectivo: datosPago.monto_efectivo || 0,
        monto_transferencia: datosPago.monto_transferencia || 0
      });
      setMostrarModalExito(true);
      playChaChing();
      launchConfetti();
      setCarrito([]);
      setEntregarObsequio(true);

      // Actualizar inventario sin recargar la página para mantener la factura en pantalla
      if (response.data.inventario && actualizarInventario) {
        actualizarInventario(false);
      }
    } catch (err) {
      console.error("Error al registrar venta:", err);
      alert(err.response?.data?.detail || "Error al procesar la venta");
    }
  };

  const handleCerrarSesion = () => {
    if (carrito.length > 0) {
      if (window.confirm("Tienes productos en el carrito. ¿Estás seguro de que deseas salir?")) {
        cerrarSesion();
      }
    } else {
      cerrarSesion();
    }
  };

  const cerrarModalExito = () => {
    setMostrarModalExito(false);
    setVentaExitosa(null);
  };

  // ===== GENERAR Y ENVIAR FACTURA (TIRILLA TÉRMICA VISUAL EN WHATSAPP Y CORREO) =====
  const generarTextoFactura = (venta) => {
    const linea = '─────────────────────────────';
    const lineaDoble = '═══════════════════════════════';
    const items = venta.productos.map(p => {
      if (p.esObsequio) {
        return `  🎁 ${p.cantidad}x ${p.nombre}\n       ✨ GRATIS ($0)`;
      }
      return `  🔹 ${p.cantidad}x ${p.nombre}${p.incluido ? ' (incluido)' : ''}\n       💰 ${formatPrice(p.subtotal)}`;
    }).join('\n');

    return `╔${lineaDoble}╗\n` +
      `║   🧊 *${STORE_TITLE_UPPER}* 🧊   ║\n` +
      `║   _Punto de Venta Oficial_   ║\n` +
      `╠${lineaDoble}╣\n\n` +
      `🧾 *RECIBO DE VENTA:* #${venta.id}\n` +
      `📅 *Fecha:* ${venta.fecha}\n` +
      `👤 *Cajero:* ${venta.cajero}\n` +
      `💳 *Pago:* ${venta.metodo_pago === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}\n\n` +
      `${linea}\n` +
      `🛒 *DETALLE DEL PEDIDO:*\n` +
      `${items}\n` +
      `${linea}\n` +
      `✅ *TOTAL PAGADO:* *${formatPrice(venta.total)}*\n` +
      (venta.cambio > 0 ? `💸 *Cambio entregado:* ${formatPrice(venta.cambio)}\n` : `✔️ *Estado:* Pago exacto\n`) +
      `${linea}\n` +
      `🌟 _¡Gracias por elegir ${STORE_NAME}!_\n` +
      `🍟 _Visítanos pronto de nuevo_ 🫶`;
  };

  const enviarFacturaWhatsApp = (venta) => {
    const texto = generarTextoFactura(venta);
    const tel = window.prompt("Ingresa el número de WhatsApp del cliente (ejemplo: 3001234567)\nO déjalo vacío para abrir WhatsApp y elegir el contacto:");
    if (tel === null) return;
    
    let url = '';
    const telLimpio = tel.replace(/[^0-9]/g, '');
    if (telLimpio.length >= 10) {
      const codigoPais = telLimpio.startsWith('57') ? telLimpio : `57${telLimpio}`;
      url = `https://api.whatsapp.com/send?phone=${codigoPais}&text=${encodeURIComponent(texto)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    }
    window.open(url, '_blank');
  };

  const enviarFacturaCorreo = (venta) => {
    const email = window.prompt("Ingresa el correo electrónico del cliente:");
    if (!email) return;
    const texto = generarTextoFactura(venta);
    const asunto = `Factura de Venta #${venta.id} - ${STORE_NAME}`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto.replace(/\*/g, '').replace(/_/g, ''))}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="pos-container">
      {/* HEADER DEL POS */}
      <div className="pos-header">
        <div className="logo-area">
          <img src={logoImg} alt={STORE_NAME} className="logo-img" />
          <span className="pos-badge">{POS_BADGE_TEXT}</span>
        </div>
        <div className="user-area">
          <div className="user-details">
            <span className="user-icon"><FiUser aria-hidden="true" /></span>
            <div className="user-text">
              <span className="user-name">{usuario.nombre}</span>
              <span className="user-role">Cajero</span>
            </div>
          </div>

          <BaseDelDia usuario={usuario} />

          <button
            type="button"
            onClick={() => setMostrarTablaObsequios(true)}
            className="obsequios-header-btn"
            title="Ver escala de obsequios por compras mayoristas"
          >
            <FiGift aria-hidden="true" /> Obsequios
          </button>

          <button onClick={() => setMostrarCuadre(true)} className="cuadre-btn">
            <FiClipboard aria-hidden="true" /> Cuadre
          </button>
          
          <button onClick={() => setMostrarDespachos(true)} className="despachos-btn">
            <FiTruck aria-hidden="true" /> Despachos
          </button>

          {/* SWITCH DE SONIDO 🔊 / 🔇 */}
          <button 
            type="button" 
            onClick={toggleSonido} 
            className="sound-toggle-btn" 
            title={sonidoActivo ? 'Silenciar sonidos del sistema' : 'Activar sonidos del sistema'} 
            aria-label={sonidoActivo ? 'Silenciar sonidos' : 'Activar sonidos'}
          >
            {sonidoActivo ? <FiVolume2 aria-hidden="true" /> : <FiVolumeX aria-hidden="true" />}
          </button>

          {/* MODO OSCURO */}
          <button 
            type="button" 
            onClick={toggleDarkMode} 
            className="theme-toggle-btn" 
            title={darkMode ? 'Modo claro' : 'Modo oscuro'} 
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
          </button>

          <button onClick={handleCerrarSesion} className="logout-btn">
            <FiLogOut className="logout-icon" /> Salir
          </button>
        </div>
      </div>

      {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}

      {/* GRID DE CATEGORÍAS */}
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
                        <img src={getImagenProducto(producto.imagen_url)} alt={producto.subcategoria || producto.nombre} />
                      ) : (
                        <div className="producto-sin-imagen"></div>
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
                      + Agregar
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
                        <img src={getImagenProducto(combo.imagen_url)} alt={combo.nombre} />
                      ) : (
                        <div className="combo-sin-imagen"></div>
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
                      + Agregar Combo
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EMPANADAS CON BARRA DE PROGRESO */}
      {mostrarModalEmpanadas && comboEmpanadas && (() => {
        const totalActual = Object.entries(seleccionEmpanadas).reduce(
          (sum, [id, cant]) => sum + cant * getUnidadesPorPaquete(parseInt(id)), 0
        );
        const requerido = comboEmpanadas.requerido;
        const porcentaje = Math.min(100, Math.round((totalActual / requerido) * 100));
        const completo = totalActual === requerido;
        const faltantes = requerido - totalActual;

        return (
          <div className="modal-overlay" onClick={() => setMostrarModalEmpanadas(false)}>
            <div className="modal-content personalizar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🍱 Seleccionar Sabores del Combo</h2>
                <button className="close-btn" onClick={() => setMostrarModalEmpanadas(false)}>✕</button>
              </div>
              
              <div className="modal-body personalizar-body">
                <div className={`combo-progress-card ${completo ? 'completo' : ''}`}>
                  <div className="progress-info-row">
                    <span className="combo-nombre-badge">
                      <strong>{comboEmpanadas.combo.nombre}</strong>
                    </span>
                    <span className={`progress-status-badge ${completo ? 'badge-exito' : 'badge-pendiente'}`}>
                      {completo ? '✨ ¡Cupo completado!' : `Faltan ${faltantes} unidades`}
                    </span>
                  </div>

                  <div className="progress-bar-track">
                    <div 
                      className={`progress-bar-fill ${completo ? 'fill-completo' : ''}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  
                  <div className="progress-numbers-row">
                    <span>Asignadas: <strong>{totalActual}</strong> de {requerido} uds</span>
                    <span><strong>{porcentaje}%</strong></span>
                  </div>
                </div>

                <div className="empanadas-scroll-list">
                  {comboEmpanadas.productosEmpanadas.map(prod => {
                    const up = getUnidadesPorPaquete(prod.id);
                    const seleccion = seleccionEmpanadas[prod.id] || 0;
                    const maxPaquetesAlcanzado = seleccion >= prod.cantidad;

                    return (
                      <div key={prod.id} className={`asignacion-item ${seleccion > 0 ? 'item-seleccionado' : ''}`}>
                        <div className="asignacion-info">
                          <span className="paquete-nombre">{prod.subcategoria || prod.nombre}</span>
                          <span className="paquete-meta">
                            {up} uds/paq • Stock: {prod.cantidad} paq.
                          </span>
                        </div>

                        <div className="asignacion-controles">
                          <button
                            className="cantidad-btn btn-menos"
                            onClick={() => handleEmpanadaChange(prod.id, -1)}
                            disabled={seleccion <= 0}
                          >
                            −
                          </button>
                          <span className="asignacion-valor">{seleccion}</span>
                          <button
                            className="cantidad-btn btn-mas"
                            onClick={() => handleEmpanadaChange(prod.id, 1)}
                            disabled={totalActual >= requerido || maxPaquetesAlcanzado}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  className={`btn-aplicar-personalizacion ${completo ? 'btn-listo-pulse' : 'btn-bloqueado'}`} 
                  onClick={confirmarSeleccionEmpanadas}
                  disabled={!completo}
                >
                  {completo ? '✅ Agregar combo al carrito' : `⏳ Faltan ${faltantes} unidades para completar`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================
          CARRITO DE COMPRAS — DISEÑO MODERNO ESTILO TARJETAS + OBSEQUIOS
      ============================================================ */}
      <div className="carrito-container">
        {/* CABECERA DEL CARRITO */}
        <div className="carrito-header-card">
          <div className="carrito-header-left">
            <span className="carrito-badge-icono">🛍️</span>
            <div>
              <h2 className="carrito-titulo">Tu Carrito de Compras</h2>
              <span className="carrito-contador-items">
                {totalUnidadesCarrito} {totalUnidadesCarrito === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </span>
            </div>
          </div>
          {carrito.length > 0 && (
            <button 
              type="button" 
              className="btn-vaciar-carrito" 
              onClick={() => {
                if (window.confirm("¿Deseas vaciar todos los productos del carrito?")) {
                  setCarrito([]);
                }
              }}
              title="Vaciar carrito"
            >
              Vaciar
            </button>
          )}
        </div>

        {carrito.length === 0 ? (
          <div className="carrito-vacio-box">
            <span className="vacio-icono">🛒</span>
            <p className="carrito-vacio-texto">Tu carrito está vacío</p>
            <span className="carrito-vacio-sub">Selecciona una categoría arriba para agregar productos</span>
            <button
              type="button"
              className="btn-ver-escala-link"
              onClick={() => setMostrarTablaObsequios(true)}
            >
              🎁 Por cada $100.000 de compra obsequiamos 1 Bandeja Deditos x20 (Ver tabla)
            </button>
          </div>
        ) : (
          <>
            {/* PROGRESO O TARJETA DE OBSEQUIO POR VOLUMEN */}
            {obsequiosGanados === 0 ? (
              <div className="obsequio-progreso-card">
                <div className="obsequio-progreso-top">
                  <span>
                    🎁 Agrega <strong>{formatPrice(faltaSiguienteObsequio)}</strong> más para ganar <strong>1 Bandeja Deditos x20 GRATIS</strong>
                  </span>
                  <button
                    type="button"
                    className="obsequio-tabla-mini-btn"
                    onClick={() => setMostrarTablaObsequios(true)}
                  >
                    Ver escala
                  </button>
                </div>
                <div className="obsequio-barra-track">
                  <div
                    className="obsequio-barra-fill"
                    style={{ width: `${porcentajeMetaObsequio}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className={`obsequio-ganado-card ${!entregarObsequio ? 'obsequio-pausado' : ''}`}>
                <div className="obsequio-ganado-header">
                  <div className="obsequio-ganado-title">
                    <span className="obsequio-gift-emoji">🎁</span>
                    <div>
                      <strong>¡OBSEQUIO POR VOLUMEN!</strong>
                      <small>Por cada $100.000 llevas 1 bandeja gratis</small>
                    </div>
                  </div>
                  <label className="obsequio-switch-label" title="Activar o desactivar entrega del obsequio">
                    <input
                      type="checkbox"
                      checked={entregarObsequio}
                      onChange={(e) => setEntregarObsequio(e.target.checked)}
                    />
                    <span>Entregar</span>
                  </label>
                </div>

                <div className="obsequio-ganado-detalle">
                  <div className="obsequio-producto-linea">
                    <span className="obsequio-cant-badge">{obsequiosGanados}x</span>
                    <span className="obsequio-prod-nombre">
                      BANDEJA DE 20 UNIDADES DEDITOS
                    </span>
                  </div>
                  <div className="obsequio-precios-box">
                    <span className="obsequio-precio-tachado">
                      {formatPrice(obsequiosGanados * (productoObsequio?.precio || PRECIO_REF_OBSEQUIO))}
                    </span>
                    <span className="obsequio-gratis-pill">GRATIS $0</span>
                  </div>
                </div>

                {entregarObsequio && productoObsequio && stockDisponibleObsequio < obsequiosGanados && (
                  <div className="obsequio-alerta-stock">
                    ⚠️ Stock disponible de Deditos x20: {stockDisponibleObsequio} bandeja(s). Se descontarán {cantidadObsequioEfectiva} del inventario.
                  </div>
                )}

                {entregarObsequio && cantidadObsequioEfectiva > 0 && (
                  <div className="obsequio-kardex-nota">
                    ✓ Descuenta {cantidadObsequioEfectiva} bandeja(s) del inventario automáticamente al cobrar
                  </div>
                )}

                <div className="obsequio-siguiente-meta">
                  <span>
                    Siguiente obsequio (#{obsequiosGanados + 1}) en <strong>{formatPrice(faltaSiguienteObsequio)}</strong>
                  </span>
                  <button
                    type="button"
                    className="obsequio-tabla-mini-btn"
                    onClick={() => setMostrarTablaObsequios(true)}
                  >
                    Tabla
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE PRODUCTOS TIPO TARJETAS */}
            <div className="carrito-items-cards">
              {carrito.map((item, idx) => {
                const img = item.imagen_url ? getImagenProducto(item.imagen_url) : null;
                return (
                  <div key={idx} className="carrito-card-item">
                    {/* IMAGEN MINIATURA */}
                    <div className="carrito-item-img-wrapper">
                      {img ? (
                        <img src={img} alt={item.nombre} className="carrito-item-thumb" />
                      ) : (
                        <div className="carrito-item-placeholder">
                          {item.esCombo ? '🍱' : '🥟'}
                        </div>
                      )}
                    </div>

                    {/* INFORMACIÓN DEL PRODUCTO */}
                    <div className="carrito-item-info">
                      <h4 className="carrito-item-titulo">{item.nombre}</h4>
                      <div className="carrito-item-badges">
                        {item.esCombo && <span className="badge-pill badge-combo">COMBO</span>}
                        {item.incluido && <span className="badge-pill badge-incluido">INCLUIDO</span>}
                        {!item.esCombo && !item.incluido && <span className="badge-pill badge-estandar">PAQUETE</span>}
                      </div>
                      <span className="carrito-item-precio">
                        {item.precio === 0 && item.incluido ? 'Gratis en combo' : formatPrice(item.subtotal)}
                      </span>
                    </div>

                    {/* CONTROLES DE CANTIDAD EN PÍLDORA */}
                    <div className="carrito-item-acciones">
                      {!item.incluido ? (
                        <div className="pill-cantidad-control">
                          <button
                            type="button"
                            className="btn-pill-menos"
                            onClick={() => actualizarCantidadCarrito(idx, item.cantidad - 1)}
                            disabled={item.cantidad <= 1}
                            title="Disminuir"
                          >
                            −
                          </button>
                          <span className="pill-cantidad-valor">{item.cantidad}</span>
                          <button
                            type="button"
                            className="btn-pill-mas"
                            onClick={() => actualizarCantidadCarrito(idx, item.cantidad + 1)}
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="item-incluido-cant">x{item.cantidad}</span>
                      )}

                      {/* BOTÓN ELIMINAR */}
                      <button
                        type="button"
                        className="btn-eliminar-item"
                        aria-label={`Quitar ${item.nombre} del carrito`}
                        title="Quitar del carrito"
                        onClick={() => eliminarDelCarrito(idx)}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL Y BOTÓN DE CONFIRMAR */}
            <div className="carrito-footer-box">
              {cantidadObsequioEfectiva > 0 && (
                <div className="carrito-resumen-obsequio-row">
                  <span>🎁 Obsequio incluido:</span>
                  <strong>{cantidadObsequioEfectiva}x Deditos x20 ($0)</strong>
                </div>
              )}
              <div className="carrito-resumen-total">
                <span className="total-titulo">TOTAL A PAGAR:</span>
                <span className="total-precio-grande">{formatPrice(totalCarrito)}</span>
              </div>
              <button 
                type="button" 
                className="btn-confirmar-pedido-grande" 
                onClick={registrarVentaFinal}
              >
                <FiCheckCircle /> REGISTRAR VENTA / COBRAR
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL ESCALA DE OBSEQUIOS POR VOLUMEN */}
      {mostrarTablaObsequios && (
        <div className="modal-overlay" onClick={() => setMostrarTablaObsequios(false)}>
          <div className="modal-content obsequios-escala-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎁 Tabla Oficial de Obsequios Mayoristas</h2>
              <button className="close-btn" onClick={() => setMostrarTablaObsequios(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="obsequios-regla-banner">
                POR COMPRAS DE CADA <strong>$100.000</strong> SE OBSEQUIA UNA BANDEJA DE <strong>20 UNIDADES DEDITOS ({formatPrice(productoObsequio?.precio || PRECIO_REF_OBSEQUIO)})</strong>
              </div>
              <div className="obsequios-tabla-wrapper">
                <table className="obsequios-escala-table">
                  <thead>
                    <tr>
                      <th>VENTA</th>
                      <th>OBSEQUIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ESCALA_OBSEQUIOS.map((fila) => {
                      const activo = obsequiosGanados === fila.bandejas;
                      return (
                        <tr key={fila.venta} className={activo ? 'fila-obsequio-activa' : ''}>
                          <td><strong>{formatPrice(fila.venta)}</strong></td>
                          <td>🎁 {fila.descripcion}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TICKET TÉRMICO CON BOTONES DE WHATSAPP, EMAIL, IMPRIMIR */}
      {mostrarModalExito && ventaExitosa && (
        <div className="modal-overlay ticket-modal-overlay" onClick={cerrarModalExito}>
          <div className="modal-content ticket-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="ticket-close-btn" 
              onClick={cerrarModalExito} 
              title="Cerrar ticket"
            >
              ✕
            </button>

            <div className="ticket-papel">
              <div className="ticket-header">
                <div className="ticket-logo">🧊❄️</div>
                <h2>{STORE_TITLE_UPPER}</h2>
                <p className="ticket-subtitulo">Punto de Venta Oficial • Picadas Congeladas</p>
                <div className="ticket-divisor-punteado" />
                <div className="ticket-datos">
                  <span><strong>Venta #:</strong> {ventaExitosa.id}</span>
                  <span><strong>Fecha:</strong> {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <div className="ticket-datos">
                  <span><strong>Cajero:</strong> {usuario?.nombre || 'General'}</span>
                  <span><strong>Pago:</strong> {ventaExitosa.metodo_pago === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}</span>
                </div>
                <div className="ticket-divisor-punteado" />
              </div>

              <div className="ticket-articulos">
                {ventaExitosa.productos.map((item, idx) => (
                  <div key={idx} className={`ticket-item-row ${item.esObsequio ? 'ticket-item-obsequio' : ''}`}>
                    <span className="ticket-item-nombre">
                      {item.esObsequio ? '🎁 ' : ''}{item.cantidad}x {item.nombre} {item.incluido && '(inc)'}
                    </span>
                    <span className="ticket-item-subtotal">
                      {item.esObsequio ? 'GRATIS ($0)' : formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="ticket-divisor-punteado" />

              <div className="ticket-totales">
                <div className="ticket-total-row">
                  <span>TOTAL PAGADO:</span>
                  <strong>{formatPrice(ventaExitosa.total)}</strong>
                </div>
              </div>

              {ventaExitosa.cambio > 0 ? (
                <div className="ticket-cambio-destacado">
                  <span className="cambio-label">CAMBIO A ENTREGAR</span>
                  <span className="cambio-monto">{formatPrice(ventaExitosa.cambio)}</span>
                </div>
              ) : (
                <div className="ticket-pago-exacto">
                  <span>✔️ Pago exacto (Sin cambio)</span>
                </div>
              )}

              <div className="ticket-footer-msg">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>

            {/* BOTONES DE ACCION: WHATSAPP, EMAIL, IMPRIMIR Y NUEVA VENTA */}
            <div className="ticket-acciones-grid">
              <button 
                type="button" 
                className="btn-ticket-whatsapp" 
                onClick={() => enviarFacturaWhatsApp(ventaExitosa)}
                title="Enviar ticket por WhatsApp"
              >
                <FiSend /> WhatsApp
              </button>
              <button 
                type="button" 
                className="btn-ticket-email" 
                onClick={() => enviarFacturaCorreo(ventaExitosa)}
                title="Enviar ticket por correo electrónico"
              >
                <FiMail /> Correo
              </button>
              <button 
                type="button" 
                className="btn-ticket-imprimir" 
                onClick={() => window.print()}
                title="Imprimir ticket térmico"
              >
                <FiPrinter /> Imprimir
              </button>
              <button 
                type="button" 
                className="btn-ticket-nueva-venta" 
                onClick={cerrarModalExito}
                title="Cerrar factura y empezar nueva venta"
              >
                🛒 Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO CON BILLETES RÁPIDOS */}
      {mostrarModalPago && (
        <ModalPago
          total={totalCarrito}
          usuario={usuario}
          onConfirm={confirmarPago}
          onCancel={() => setMostrarModalPago(false)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && datosPagoConfirmacion && (
        <div className="modal-overlay" onClick={() => {
          setMostrarConfirmacion(false);
          setDatosPagoConfirmacion(null);
          setMostrarModalPago(true);
        }}>
          <div className="modal-content confirmacion-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header confirmacion-header">
              <h2>✅ Confirmar Pago</h2>
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
                {cantidadObsequioEfectiva > 0 && (
                  <p style={{ color: '#059669', fontWeight: 700 }}>
                    <strong>🎁 Obsequio a empacar:</strong> {cantidadObsequioEfectiva}x Bandeja Deditos x20 ($0)
                  </p>
                )}
              </div>
              <div className="confirmacion-buttons">
                <button className="btn-cancelar-confirmacion" onClick={() => {
                  setMostrarConfirmacion(false);
                  setDatosPagoConfirmacion(null);
                  setMostrarModalPago(true);
                }}>
                  No
                </button>
                <button className="btn-ejecutar-confirmacion" onClick={ejecutarPago}>
                  Sí, confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CUADRE DE CAJA */}
      {mostrarCuadre && (
        <CashRegister
          usuario={usuario}
          inventario={inventario}
          onClose={() => setMostrarCuadre(false)}
        />
      )}

      {/* MODAL DE DESPACHOS */}
      {mostrarDespachos && (
        <DespachosModal
          inventario={inventario}
          usuario={usuario}
          actualizarInventario={actualizarInventario}
          onClose={() => setMostrarDespachos(false)}
        />
      )}
    </div>
  );
}

export default POS;
