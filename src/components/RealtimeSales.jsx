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

  // Obtener rango UTC del día actual en Colombia
  const getRangoDiaActual = () => {
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const [year, month, day] = fechaStr.split('-').map(Number);
    const inicioUTC = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
    const finUTC = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59));
    return {
      inicio: inicioUTC.toISOString(),
      fin: finUTC.toISOString()
    };
  };

  useEffect(() => {
    loadRecentSales();
    const unsubscribe = subscribeToSales((newSale) => {
      console.log('Nueva venta recibida en tiempo real:', newSale);
      setRecentSales((prev) => {
        const rango = getRangoDiaActual();
        if (newSale.fecha >= rango.inicio && newSale.fecha <= rango.fin) {
          const exists = prev.some(s => s.id_venta === newSale.id_venta);
          if (!exists) {
            return [newSale, ...prev];
          }
        }
        return prev;
      });
      setConnectionStatus('conectado');
    });

    return unsubscribe;
  }, []);

  const loadRecentSales = async () => {
    setLoading(true);
    try {
      const rango = getRangoDiaActual();
      const { data, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .gte('fecha', rango.inicio)
        .lte('fecha', rango.fin)
        .order('fecha', { ascending: false });

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
      const { data: detalles, error } = await supabase
        .from('detalle_ventas')
        .select('*')
        .eq('id_venta', venta.id_venta);

      if (error) throw error;

      // Obtener nombres de productos SOLO para los que tienen producto_id no nulo
      const productoIds = detalles
        .filter(d => d.producto_id !== null)
        .map(d => d.producto_id);

      let inventarioMap = {};
      if (productoIds.length > 0) {
        const { data: inventario, error: invError } = await supabase
          .from('inventario')
          .select('id, nombre, subcategoria')
          .in('id', productoIds);

        if (invError) {
          console.warn('Error obteniendo nombres de productos:', invError);
        } else {
          inventario.forEach(p => {
            inventarioMap[p.id] = p;
          });
        }
      }

      // Construir detalles con nombre mostrado
      const detallesMostrar = detalles.map(d => {
        if (d.producto_id === null) {
          // Es un ítem de precio de combo personalizado: usar descripcion
          return {
            ...d,
            nombre_mostrado: d.descripcion || 'Combo',
            esPrecioCombo: true
          };
        } else {
          const producto = inventarioMap[d.producto_id];
          const nombreProducto = producto?.subcategoria || producto?.nombre || `Producto #${d.producto_id}`;
          return {
            ...d,
            nombre_mostrado: nombreProducto,
            esPrecioCombo: false
          };
        }
      });

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
        detalles: detallesMostrar,
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
        <div className="loading-state">Cargando ventas del día...</div>
      </div>
    );
  }

  const totalVentas = recentSales.length;

  return (
    <div className="realtime-sales">
      <div className="realtime-header">
        <h3>🔄 Ventas en Tiempo Real</h3>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'conectado' && `🟢 En vivo (${totalVentas} ventas)`}
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
          <p>No hay ventas registradas hoy</p>
          <p className="mensaje-espera">Las nuevas ventas aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <>
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
          {totalVentas > 20 && (
            <div className="total-ventas-dia">
              Mostrando todas las {totalVentas} ventas del día
            </div>
          )}
        </>
      )}

      {/* Modal de detalle de venta (corregido para mostrar nombre de combo) */}
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
                          {detalleVenta.detalles.map((d, idx) => (
                            <tr key={idx} className={d.esPrecioCombo ? 'combo-row-detalle' : ''}>
                              <td>
                                {d.esPrecioCombo && '🍱 '}
                                {d.nombre_mostrado}
                              </td>
                              <td>{d.cantidad}</td>
                              <td>{formatPrice(d.precio_unitario)}</td>
                              <td>{formatPrice(d.subtotal)}</td>
                            </tr>
                          ))}
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
