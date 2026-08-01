import React, { useState, useEffect } from 'react';
import { subscribeToSales } from '../services/realtimeService';
import { supabase } from '../services/supabaseClient';
import { formatHoraColombia } from '../utils/dateUtils';
import { formatPrice } from '../utils/formatPrice';
import './OwnerDashboard.css';

function RealtimeSales() {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('conectando...');

  // Estados para el modal de detalle
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    loadRecentSales();
    const unsubscribe = subscribeToSales((newSale) => {
      console.log('Nueva venta recibida en tiempo real:', newSale);
      setRecentSales((prev) => {
        const newList = [newSale, ...prev].slice(0, 10);
        return newList;
      });
      setConnectionStatus('conectado');
    });

    return unsubscribe;
  }, []);

  const loadRecentSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setRecentSales(data);
        setConnectionStatus('conectado');
      } else {
        setRecentSales([]);
        setConnectionStatus('sin_datos');
      }
    } catch (err) {
      console.error('Error cargando ventas recientes:', err);
      setError(err.message);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNCIÓN PARA VER DETALLE DE VENTA (CORREGIDA) =====
  const verDetalleVenta = async (venta) => {
    setVentaSeleccionada(venta);
    setMostrarDetalle(true);
    setCargandoDetalle(true);

    try {
      // 1. Obtener detalles de la venta (productos)
      const { data: detalles, error } = await supabase
        .from('detalle_ventas')
        .select('*')
        .eq('id_venta', venta.id_venta);

      if (error) throw error;

      // 2. Obtener nombres de productos de inventario
      let productosConNombre = [];
      if (detalles && detalles.length > 0) {
        const productoIds = detalles.map(d => d.producto_id);
        const { data: inventario, error: invError } = await supabase
          .from('inventario')
          .select('id, nombre, subcategoria')
          .in('id', productoIds);

        if (invError) {
          console.warn('Error obteniendo nombres de productos:', invError);
          // Fallback: usar nombres genéricos
          productosConNombre = detalles.map(d => ({
            ...d,
            inventario: { nombre: `Producto #${d.producto_id}`, subcategoria: '' }
          }));
        } else {
          // Mapear inventario a los detalles
          const inventarioMap = {};
          inventario.forEach(p => {
            inventarioMap[p.id] = p;
          });
          productosConNombre = detalles.map(d => ({
            ...d,
            inventario: inventarioMap[d.producto_id] || { 
              nombre: `Producto #${d.producto_id}`, 
              subcategoria: '' 
            }
          }));
        }
      }

      // 3. Obtener nombre del cajero
      const { data: cajero, error: cajeroError } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', venta.cajero_id)
        .single();

      if (cajeroError && cajeroError.code !== 'PGRST116') {
        console.warn('No se pudo obtener el nombre del cajero:', cajeroError);
      }

      setDetalleVenta({
        ...venta,
        detalles: productosConNombre,
        cajero_nombre: cajero?.nombre || 'Cajero #' + venta.cajero_id
      });

    } catch (err) {
      console.error('Error cargando detalle de venta:', err);
      alert('Error al cargar el detalle de la venta: ' + err.message);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setVentaSeleccionada(null);
    setDetalleVenta(null);
  };

  if (loading) {
    return (
      <div className="realtime-sales">
        <h3>🔄 Ventas en Tiempo Real</h3>
        <div className="loading-state">Cargando ventas recientes...</div>
      </div>
    );
  }

  return (
    <div className="realtime-sales">
      <div className="realtime-header">
        <h3>🔄 Ventas en Tiempo Real</h3>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'conectado' && '🟢 En vivo'}
          {connectionStatus === 'conectando...' && '🟡 Conectando...'}
          {connectionStatus === 'sin_datos' && '⚪ Sin ventas'}
          {connectionStatus === 'error' && '🔴 Error'}
        </div>
      </div>

      {error && (
        <div className="realtime-error">
          Error de conexión: {error}
          <button onClick={loadRecentSales} className="retry-btn">Reintentar</button>
        </div>
      )}

      {recentSales.length === 0 ? (
        <div className="sin-ventas-realtime">
          <p>No hay ventas registradas aún</p>
          <p className="mensaje-espera">Las nuevas ventas aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <ul className="sales-list">
          {recentSales.map((sale, idx) => (
            <li
              key={idx}
              className="sale-item clickeable"
              onClick={() => verDetalleVenta(sale)}
            >
              <div className="sale-info">
                <span className="sale-id">Venta #{sale.id_venta}</span>
                <span className="sale-time">
                  {formatHoraColombia(sale.fecha)}
                </span>
              </div>
              <div className="sale-amount">
                {formatPrice(sale.total_venta)}
                <span className="sale-click-icon">🔍</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ============================================================
          MODAL DE DETALLE DE VENTA
          ============================================================ */}
      {mostrarDetalle && detalleVenta && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-content detalle-venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Detalle de Venta #{detalleVenta.id_venta}</h2>
              <button className="close-btn" onClick={cerrarDetalle}>✕</button>
            </div>
            <div className="modal-body detalle-venta-body">
              {cargandoDetalle ? (
                <div className="loading-state">Cargando detalle...</div>
              ) : (
                <>
                  <div className="detalle-venta-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">📅 Fecha:</span>
                        <span className="value">{new Date(detalleVenta.fecha).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">👤 Cajero:</span>
                        <span className="value">{detalleVenta.cajero_nombre}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">💳 Método de pago:</span>
                        <span className="value">
                          {detalleVenta.metodo_pago === 'efectivo' ? 'Efectivo' : 
                           detalleVenta.metodo_pago === 'compartida' ? 'Compartida (Efectivo + Transferencia)' : 
                           'Transferencia'}
                        </span>
                      </div>
                      {detalleVenta.cambio > 0 && (
                        <div className="info-item">
                          <span className="label">🔄 Cambio:</span>
                          <span className="value">{formatPrice(detalleVenta.cambio)}</span>
                        </div>
                      )}
                      <div className="info-item total-venta">
                        <span className="label">💰 Total:</span>
                        <span className="value">{formatPrice(detalleVenta.total_venta)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detalle-productos-tabla">
                    <h4>📦 Productos</h4>
                    {!detalleVenta.detalles || detalleVenta.detalles.length === 0 ? (
                      <p className="sin-productos">No hay productos detallados para esta venta</p>
                    ) : (
                      <table className="detalle-productos-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalleVenta.detalles.map((d, idx) => {
                            const nombreProducto = d.inventario?.subcategoria || 
                                                    d.inventario?.nombre || 
                                                    `Producto #${d.producto_id}`;
                            return (
                              <tr key={idx}>
                                <td>{nombreProducto}</td>
                                <td>{d.cantidad}</td>
                                <td>{formatPrice(d.precio_unitario)}</td>
                                <td>{formatPrice(d.subtotal)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="total-row-detalle">
                            <td colSpan="3"><strong>Total</strong></td>
                            <td><strong>{formatPrice(detalleVenta.total_venta)}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar-detalle" onClick={cerrarDetalle}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealtimeSales;
