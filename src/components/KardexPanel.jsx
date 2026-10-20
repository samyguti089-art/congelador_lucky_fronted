import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './OwnerDashboard.css';

const getFechaColombia = (diasAtras = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);
};

function KardexPanel({ inventario = [] }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productoFiltro, setProductoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFechaColombia(7)); // Últimos 7 días por defecto
  const [fechaHasta, setFechaHasta] = useState(getFechaColombia(0));

  useEffect(() => {
    cargarKardex();
  }, [productoFiltro, tipoFiltro, fechaDesde, fechaHasta]);

  const cargarKardex = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('kardex_inventario')
        .select('*')
        .gte('fecha', `${fechaDesde}T00:00:00-05:00`)
        .lte('fecha', `${fechaHasta}T23:59:59-05:00`)
        .order('id', { ascending: false });

      if (productoFiltro) {
        query = query.eq('producto_id', parseInt(productoFiltro));
      }
      if (tipoFiltro) {
        query = query.eq('tipo_movimiento', tipoFiltro);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setMovimientos(data || []);
    } catch (err) {
      console.error('Error cargando Kardex:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaHora = (fechaIso) => {
    if (!fechaIso) return '-';
    return new Date(fechaIso).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Totales de entradas y salidas para el periodo filtrado
  const totalEntradas = movimientos
    .filter(m => m.cambio > 0)
    .reduce((sum, m) => sum + Number(m.cambio), 0);

  const totalSalidas = movimientos
    .filter(m => m.cambio < 0)
    .reduce((sum, m) => sum + Math.abs(Number(m.cambio)), 0);

  return (
    <div className="kardex-panel" style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>📋 Kardex / Auditoría de Inventario</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Historial inmutable de cada venta, despacho y ajuste registrado automáticamente
          </p>
        </div>
        <button 
          onClick={cargarKardex} 
          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* TARJETAS RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '14px' }}>
          <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>📥 Total Entradas (Despachos)</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#15803d' }}>+{totalEntradas} paq.</h3>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '14px' }}>
          <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600 }}>📤 Total Salidas (Ventas)</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#dc2626' }}>-{totalSalidas} paq.</h3>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>🔍 Movimientos Listados</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#0f172a' }}>{movimientos.length}</h3>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Producto:</label>
          <select 
            value={productoFiltro} 
            onChange={(e) => setProductoFiltro(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
          >
            <option value="">Todos los productos</option>
            {inventario.map(p => (
              <option key={p.id} value={p.id}>{p.subcategoria || p.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Tipo de Movimiento:</label>
          <select 
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
          >
            <option value="">Todos los tipos</option>
            <option value="VENTA">Ventas</option>
            <option value="DESPACHO">Despachos</option>
            <option value="ENTRADA / AJUSTE MANUAL">Ajuste Entrada</option>
            <option value="SALIDA / AJUSTE MANUAL">Ajuste Salida</option>
          </select>
        </div>

        <div style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Desde:</label>
          <input 
            type="date" 
            value={fechaDesde} 
            onChange={(e) => setFechaDesde(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Hasta:</label>
          <input 
            type="date" 
            value={fechaHasta} 
            onChange={(e) => setFechaHasta(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>Cargando auditoría de inventario...</p>
      ) : movimientos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>No hay movimientos registrados para este filtro</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Fecha y Hora</th>
                <th style={{ padding: '12px 16px' }}>Producto</th>
                <th style={{ padding: '12px 16px' }}>Tipo</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Antes</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Movimiento</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock Resultante</th>
                <th style={{ padding: '12px 16px' }}>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatearFechaHora(m.fecha)}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                    {m.producto_nombre}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: m.tipo_movimiento === 'DESPACHO' ? '#dcfce7' : m.tipo_movimiento === 'VENTA' ? '#e0f2fe' : '#fef3c7',
                      color: m.tipo_movimiento === 'DESPACHO' ? '#15803d' : m.tipo_movimiento === 'VENTA' ? '#0369a1' : '#b45309'
                    }}>
                      {m.tipo_movimiento}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
                    {m.cantidad_anterior}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: 800,
                    color: m.cambio > 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {m.cambio > 0 ? `+${m.cambio}` : m.cambio}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                    {m.cantidad_posterior}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem' }}>
                    {m.referencia_id || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default KardexPanel;
