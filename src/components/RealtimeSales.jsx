import React, { useState, useEffect } from 'react';
import { subscribeToSales } from './services/realtimeService';
import './OwnerDashboard.css';

function RealtimeSales() {
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToSales((newSale) => {
      setRecentSales((prev) => [newSale, ...prev].slice(0, 10));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="realtime-sales">
      <h3>🔄 Ventas en Tiempo Real</h3>
      <ul>
        {recentSales.map((sale, idx) => (
          <li key={idx}>
            Venta #{sale.id_venta} - ${sale.total_venta} - {new Date(sale.fecha).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RealtimeSales;
