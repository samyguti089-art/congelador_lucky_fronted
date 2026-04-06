import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function StockBajoKPI({ inventario, actualizarInventario }) {
  const [stockBajo, setStockBajo] = useState([]);
  const [umbral, setUmbral] = useState(10);

  useEffect(() => {
    filtrarStockBajo();
  }, [inventario, umbral]);

  const filtrarStockBajo = () => {
    const productosCriticos = inventario.filter(
      item => item.cantidad <= umbral && item.cantidad > 0
    );
    const productosAgotados = inventario.filter(
      item => item.cantidad === 0
    );
    
    setStockBajo({
      criticos: productosCriticos,
      agotados: productosAgotados
    });
  };

  const handleActualizar = () => {
    if (actualizarInventario) {
      actualizarInventario(false);
    }
  };

  return (
    <div className="stock-bajo-kpi">
      <div className="kpi-header">
        <h3>⚠️ Alertas de Inventario</h3>
        <button onClick={handleActualizar} className="refresh-stock-btn">
          🔄 Actualizar
        </button>
      </div>
      
      <div className="kpi-config">
        <label>
          Umbral de stock bajo:
          <input
            type="number"
            value={umbral}
            onChange={(e) => setUmbral(Number(e.target.value))}
            min="1"
            max="50"
          />
        </label>
      </div>

      <div className="stock-resumen">
        <div className="stock-card critico">
          <div className="stock-number">{stockBajo.criticos?.length || 0}</div>
          <div className="stock-label">Productos con stock bajo</div>
          <div className="stock-umbral">(&lt;= {umbral} unidades)</div>
        </div>
        <div className="stock-card agotado">
          <div className="stock-number">{stockBajo.agotados?.length || 0}</div>
          <div className="stock-label">Productos agotados</div>
          <div className="stock-umbral">(Stock = 0)</div>
        </div>
      </div>

      {(stockBajo.criticos?.length > 0 || stockBajo.agotados?.length > 0) && (
        <div className="lista-stock-bajo">
          <h4>Productos con stock crítico:</h4>
          <ul>
            {[...stockBajo.criticos, ...stockBajo.agotados].map((item) => (
              <li key={item.id} className={item.cantidad === 0 ? 'agotado-item' : 'critico-item'}>
                <span className="producto-nombre">{item.subcategoria || item.nombre}</span>
                <span className="producto-stock-actual">
                  Stock: {item.cantidad} {item.cantidad === 0 ? '❌' : '⚠️'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StockBajoKPI;
