import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import './OwnerDashboard.css';

function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    const { data, error } = await supabase.rpc('productos_mas_vendidos');
    if (error) console.error(error);
    else setTopProducts(data);
  };

  return (
    <div className="top-products">
      <h3>🏆 Productos Más Vendidos</h3>
      <ol>
        {topProducts.map((product, index) => (
          <li key={index}>{product.nombre} - {product.total_vendido} unidades</li>
        ))}
      </ol>
    </div>
  );
}

export default TopProducts;
