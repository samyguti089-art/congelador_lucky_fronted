import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FaMoneyBillWave, FaShoppingCart, FaUsers, FaCalendarDay } from 'react-icons/fa';
import { formatHoraColombia } from '../utils/dateUtils';
import './OwnerDashboard.css';

function DailySalesKPI() {
  const [ventasHoy, setVentasHoy] = useState({
    total: 0,
    cantidad: 0,
    transacciones: 0,
    promedio: 0
  });
  const [ventasDetalle, setVentasDetalle] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fecha en zona horaria Colombia (UTC-5) para mostrar en el badge
  const [fechaColombia] = useState(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // ✅ Rango UTC para el día colombiano
  const [rangoUTC] = useState(() => {
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const [year, month, day] = fechaStr.split('-').map(Number);
    const inicio = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
    const fin = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59));
    return {
      inicio: inicio.toISOString(),
      fin: fin.toISOString()
    };
  });

  useEffect(() => {
    fetchVentasDelDia();
  }, []);

  const fetchVentasDelDia = async () => {
    setLoading(true);
    try {
      // Consulta usando rango UTC para incluir todas las ventas del día colombiano
      const { data: ventas, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .gte('fecha', rangoUTC.inicio)
        .lte('fecha', rangoUTC.fin);

      if (error) throw error;

      if (ventas && ventas.length > 0) {
        const total = ventas.reduce((sum, v) => sum + v.total_venta, 0);
        const promedio = total / ventas.length;

        setVentasHoy({
          total: total,
          cantidad: ventas.length,
          transacciones: ventas.length,
          promedio: promedio
        });

        // Obtener detalle de productos
        const idsVentas = ventas.map(v => v.id_venta);
        const { data: detalles, error: detError } = await supabase
          .from('detalle_ventas')
          .select(`
            *,
            inventario:producto_id (nombre, subcategoria)
          `)
          .in('id_venta', idsVentas);

        if (!detError && detalles) {
          const ventasConDetalle = ventas.map(venta => ({
            ...venta,
            detalles: detalles.filter(d => d.id_venta === venta.id_venta)
          }));
          setVentasDetalle(ventasConDetalle);
        } else {
          setVentasDetalle(ventas);
        }
      } else {
        setVentasHoy({ total: 0, cantidad: 0, transacciones: 0, promedio: 0 });
        setVentasDetalle([]);
      }
    } catch (err) {
      console.error('Error fetching daily sales:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-sales-kpi">
        <div className="loading-spinner">Cargando ventas del día...</div>
      </div>
    );
  }

  return (
    <div className="daily-sales-kpi">
      <div className="kpi-header">
        <h3>📊 Ventas del Día</h3>
        <div className="fecha-badge">
          <FaCalendarDay />
          <span>{fechaColombia}</span>
        </div>
      </div>
      
      <div className="kpi-cards">
        <div className="kpi-card total">
          <div className="kpi-icon">
            <FaMoneyBillWave />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Ventas</span>
            <span className="kpi-value">${ventasHoy.total.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="kpi-card transacciones">
          <div className="kpi-icon">
            <FaShoppingCart />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Transacciones</span>
            <span className="kpi-value">{ventasHoy.transacciones}</span>
          </div>
        </div>
        
        <div className="kpi-card promedio">
          <div className="kpi-icon">
            <FaUsers />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ticket Promedio</span>
            <span className="kpi-value">${Math.round(ventasHoy.promedio).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {ventasDetalle.length > 0 && (
        <div className="detalle-ventas-dia">
          <h4>Detalle de Ventas del Día</h4>
          <div className="tabla-detalle-container">
            <table className="detalle-ventas-tabla">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th># Venta</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Cajero</th>
                </tr>
              </thead>
              <tbody>
                {ventasDetalle.map((venta, idx) => (
                  <tr key={idx}>
                    <td>{formatHoraColombia(venta.fecha)}</td>
                    <td>{venta.id_venta}</td>
                    <td>
                      <div className="productos-lista">
                        {venta.detalles ? (
                          venta.detalles.map((d, i) => (
                            <span key={i} className="producto-item">
                              {d.inventario?.subcategoria || d.inventario?.nombre || 'Producto'} x{d.cantidad}
                            </span>
                          ))
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="total-cell">${venta.total_venta.toLocaleString()}</td>
                    <td>{venta.cajero_id}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-footer">
                  <td colSpan="3"><strong>Total del Día</strong></td>
                  <td className="total-footer-value">
                    <strong>${ventasHoy.total.toLocaleString()}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
      {ventasDetalle.length === 0 && (
        <div className="sin-ventas">
          <p>No hay ventas registradas hoy</p>
        </div>
      )}
    </div>
  );
}

export default DailySalesKPI;
