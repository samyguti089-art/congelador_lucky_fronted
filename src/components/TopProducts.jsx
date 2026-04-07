import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FaTrophy, FaBox, FaDollarSign } from 'react-icons/fa';
import './OwnerDashboard.css';

function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    fetchTopProducts();
  }, [periodo]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      // Obtener ventas con detalles de productos
      const { data, error } = await supabase
        .from('detalle_ventas')
        .select(`
          cantidad,
          subtotal,
          producto_id,
          inventario:producto_id (id, nombre, subcategoria, categoria, precio)
        `);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setTopProducts([]);
        setLoading(false);
        return;
      }
      
      // Filtrar por período (opcional)
      let filteredData = data;
      if (periodo === 'semana') {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        filteredData = data.filter(item => {
          // Si no hay fecha, incluir todos
          return true; // Simplificado por ahora
        });
      }
      
      // Agrupar por producto
      const productosMap = new Map();
      filteredData.forEach(item => {
        const producto = item.inventario;
        if (!producto) return;
        
        const productoId = producto.id;
        const cantidad = item.cantidad || 0;
        const subtotal = item.subtotal || 0;
        
        if (productosMap.has(productoId)) {
          const existing = productosMap.get(productoId);
          existing.total_vendido += cantidad;
          existing.total_ingresos += subtotal;
        } else {
          productosMap.set(productoId, {
            id: producto.id,
            nombre: producto.nombre || 'Producto',
            subcategoria: producto.subcategoria || '',
            categoria: producto.categoria || 'General',
            precio: producto.precio || 0,
            total_vendido: cantidad,
            total_ingresos: subtotal
          });
        }
      });
      
      const topArray = Array.from(productosMap.values())
        .sort((a, b) => b.total_vendido - a.total_vendido)
        .slice(0, 10);
      
      console.log('Top productos calculados:', topArray);
      setTopProducts(topArray);
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

  const getCategoriaIcon = (categoria) => {
    const icons = {
      deditos: '🍢',
      empanadas: '🥟',
      medallones: '🍔',
      bolitas: '🫘',
      carimañolas: '🥟',
      pizzas: '🍕',
      hayacas: '🌽'
    };
    return icons[categoria?.toLowerCase()] || '📦';
  };

  if (loading) {
    return (
      <div className="top-products-full">
        <div className="top-products-header">
          <div className="header-title">
            <FaTrophy className="trophy-icon" />
            <h3>Top Productos Más Vendidos</h3>
          </div>
        </div>
        <div className="loading-products">Cargando productos...</div>
      </div>
    );
  }

  if (topProducts.length === 0) {
    return (
      <div className="top-products-full">
        <div className="top-products-header">
          <div className="header-title">
            <FaTrophy className="trophy-icon" />
            <h3>Top Productos Más Vendidos</h3>
          </div>
          <div className="periodo-selector">
            <button className={periodo === 'semana' ? 'active' : ''} onClick={() => setPeriodo('semana')}>Semana</button>
            <button className={periodo === 'mes' ? 'active' : ''} onClick={() => setPeriodo('mes')}>Mes</button>
            <button className={periodo === 'todo' ? 'active' : ''} onClick={() => setPeriodo('todo')}>Todo</button>
          </div>
        </div>
        <div className="sin-productos">
          <p>No hay ventas registradas en este período</p>
        </div>
      </div>
    );
  }

  const totalGeneral = topProducts.reduce((sum, p) => sum + (p.total_ingresos || 0), 0);

  return (
    <div className="top-products-full">
      <div className="top-products-header">
        <div className="header-title">
          <FaTrophy className="trophy-icon" />
          <h3>Top Productos Más Vendidos</h3>
        </div>
        <div className="periodo-selector">
          <button className={periodo === 'semana' ? 'active' : ''} onClick={() => setPeriodo('semana')}>📅 Semana</button>
          <button className={periodo === 'mes' ? 'active' : ''} onClick={() => setPeriodo('mes')}>📆 Mes</button>
          <button className={periodo === 'todo' ? 'active' : ''} onClick={() => setPeriodo('todo')}>🏛️ Todo</button>
        </div>
      </div>

      <div className="top-products-table-container">
        <table className="top-products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Unidades</th>
              <th>Total Vendido</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => {
              const participacion = totalGeneral > 0 ? ((product.total_ingresos / totalGeneral) * 100).toFixed(1) : 0;
              
              return (
                <tr key={product.id}>
                  <td className="rank-cell">
                    <div className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `${index + 1}`}
                    </div>
                  </td>
                  <td className="product-cell">
                    <div className="product-info-detailed">
                      <span className="product-icon">{getCategoriaIcon(product.categoria)}</span>
                      <div className="product-text">
                        <strong>{product.nombre}</strong>
                        <span className="product-subcategoria">{product.subcategoria}</span>
                      </div>
                    </div>
                  </td>
                  <td className="unidades-cell">
                    <div className="unidades-badge">
                      <FaBox className="unidades-icon" />
                      {product.total_vendido} uds
                    </div>
                  </td>
                  <td className="total-cell">{formatCurrency(product.total_ingresos)}</td>
                  <td className="participacion-cell">
                    <div className="participacion-bar">
                      <div className="participacion-fill" style={{ width: `${participacion}%` }} />
                      <span className="participacion-text">{participacion}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-footer-products">
              <td colSpan="3"><strong>Total General</strong></td>
              <td><strong>{formatCurrency(totalGeneral)}</strong></td>
              <td><strong>100%</strong></td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default TopProducts;
