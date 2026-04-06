import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('productos_mas_vendidos');
      if (error) throw error;
      setTopProducts(data || []);
    } catch (err) {
      console.error('Error fetching top products:', err);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="top-products">
      <h3>🏆 Productos Más Vendidos</h3>
      {topProducts.length === 0 ? (
        <p className="sin-datos">No hay ventas registradas aún</p>
      ) : (
        <>
          <ol>
            {topProducts.map((product, index) => (
              <li key={index}>
                <div className="product-rank">{index + 1}</div>
                <div className="product-info">
                  <strong>{product.subcategoria || product.nombre}</strong>
                  <span>{product.total_vendido} unidades vendidas</span>
                  <span className="product-ingresos">${product.total_ingresos}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default TopProducts;
