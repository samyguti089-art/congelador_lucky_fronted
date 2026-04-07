import React, { useState, useEffect } from 'react';
import { subscribeToSales } from '../services/realtimeService';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function RealtimeSales() {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('conectando...');

  useEffect(() => {
    // Cargar ventas recientes al inicio
    loadRecentSales();
    
    // Suscribirse a nuevas ventas
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
            <li key={idx} className="sale-item">
              <div className="sale-info">
                <span className="sale-id">Venta #{sale.id_venta}</span>
                <span className="sale-time">
                  {new Date(sale.fecha).toLocaleTimeString()}
                </span>
              </div>
              <div className="sale-amount">
                ${sale.total_venta.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RealtimeSales;
