import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      // Usar la función RPC que ya funciona
      const { data, error } = await supabase.rpc('productos_mas_vendidos');
      
      if (error) {
        console.error('Error RPC:', error);
        throw error;
      }
      
      console.log('Productos más vendidos desde RPC:', data);
      setTopProducts(data || []);
    } catch (err) {
      console.error('Error fetching top products:', err);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="top-products-card">
        <h3>🏆 Productos Más Vendidos</h3>
        <div className="loading-products">Cargando productos...</div>
      </div>
    );
  }

  if (topProducts.length === 0) {
    return (
      <div className="top-products-card">
        <h3>🏆 Productos Más Vendidos</h3>
        <div className="sin-productos">
          <p>No hay ventas registradas aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className="top-products-card">
      <h3>🏆 Productos Más Vendidos</h3>
      <div className="top-products-list">
        {topProducts.map((product, index) => (
          <div key={index} className="top-product-item">
            <div className="top-product-rank">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `${index + 1}`}
            </div>
            <div className="top-product-info">
              <div className="top-product-name">
                {product.subcategoria || product.nombre}
              </div>
              <div className="top-product-stats">
                <span className="top-product-units">
                  📦 {product.total_vendido} unidades
                </span>
                <span className="top-product-revenue">
                  💰 {formatCurrency(product.total_ingresos)}
                </span>
              </div>
            </div>
            <div className="top-product-percentage">
              <div className="percentage-bar">
                <div 
                  className="percentage-fill" 
                  style={{ width: `${Math.min((product.total_vendido / topProducts[0].total_vendido) * 100, 100)}%` }}
                />
              </div>
              <span className="percentage-value">
                {Math.round((product.total_vendido / topProducts[0].total_vendido) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopProducts;
