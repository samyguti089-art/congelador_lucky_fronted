import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FaMoneyBillWave, FaShoppingCart, FaUsers, FaCalendarDay } from 'react-icons/fa';
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
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    fetchVentasDelDia();
  }, []);

  const fetchVentasDelDia = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      // Obtener ventas del día desde ventas_cabecera
      const { data, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .gte('fecha', `${hoy} 00:00:00`)
        .lte('fecha', `${hoy} 23:59:59`);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const total = data.reduce((sum, venta) => sum + venta.total_venta, 0);
        const promedio = total / data.length;
        
        setVentasHoy({
          total: total,
          cantidad: data.length,
          transacciones: data.length,
          promedio: promedio
        });
        
        // Obtener detalle de cada venta (productos vendidos)
        const idsVentas = data.map(v => v.id_venta);
        const { data: detalles, error: detError } = await supabase
          .from('detalle_ventas')
          .select(`
            *,
            inventario:producto_id (nombre, subcategoria)
          `)
          .in('id_venta', idsVentas);
        
        if (!detError && detalles) {
          // Agrupar por venta
          const ventasConDetalle = data.map(venta => ({
            ...venta,
            detalles: detalles.filter(d => d.id_venta === venta.id_venta)
          }));
          setVentasDetalle(ventasConDetalle);
        } else {
          setVentasDetalle(data);
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

  const formatearFecha = () => {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fechaActual.toLocaleDateString('es-ES', opciones);
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
          <span>{formatearFecha()}</span>
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
            <span className="kpi-value">${ventasHoy.promedio.toLocaleString()}</span>
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
                    <td>{new Date(venta.fecha).toLocaleTimeString()}</td>
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
                  <td className="total-footer-value"><strong>${ventasHoy.total.toLocaleString()}</strong></td>
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
