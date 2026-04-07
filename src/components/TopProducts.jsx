import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FaTrophy, FaBox, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
import './OwnerDashboard.css';

function TopProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes'); // mes, semana, todo

  useEffect(() => {
    fetchTopProducts();
  }, [periodo]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('detalle_ventas')
        .select(`
          cantidad,
          subtotal,
          producto_id,
          inventario:producto_id (id, nombre, subcategoria, categoria, precio)
        `);
      
      // Filtrar por período
      if (periodo === 'semana') {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        query = query.gte('created_at', fechaLimite.toISOString());
      } else if (periodo === 'mes') {
        const fechaLimite = new Date();
        fechaLimite.setMonth(fechaLimite.getMonth() - 1);
        query = query.gte('created_at', fechaLimite.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Agrupar por producto
      const productosMap = new Map();
      data.forEach(item => {
        const producto = item.inventario;
        if (!producto) return;
        
        const productoId = producto.id;
        const cantidad = item.cantidad;
        const subtotal = item.subtotal;
        
        if (productosMap.has(productoId)) {
          const existing = productosMap.get(productoId);
          existing.total_vendido += cantidad;
          existing.total_ingresos += subtotal;
        } else {
          productosMap.set(productoId, {
            id: producto.id,
            nombre: producto.nombre,
            subcategoria: producto.subcategoria,
            categoria: producto.categoria,
            precio: producto.precio,
            total_vendido: cantidad,
            total_ingresos: subtotal
          });
        }
      });
      
      const topArray = Array.from(productosMap.values())
        .sort((a, b) => b.total_vendido - a.total_vendido)
        .slice(0, 10);
      
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
    }).format(value);
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
          <h3>🏆 Top Productos Más Vendidos</h3>
        </div>
        <div className="loading-products">Cargando productos más vendidos...</div>
      </div>
    );
  }

  return (
    <div className="top-products-full">
      <div className="top-products-header">
        <div className="header-title">
          <FaTrophy className="trophy-icon" />
          <h3>🏆 Top Productos Más Vendidos</h3>
        </div>
        <div className="periodo-selector">
          <button 
            className={periodo === 'semana' ? 'active' : ''} 
            onClick={() => setPeriodo('semana')}
          >
            📅 Esta Semana
          </button>
          <button 
            className={periodo === 'mes' ? 'active' : ''} 
            onClick={() => setPeriodo('mes')}
          >
            📆 Este Mes
          </button>
          <button 
            className={periodo === 'todo' ? 'active' : ''} 
            onClick={() => setPeriodo('todo')}
          >
            🏛️ Todo el tiempo
          </button>
        </div>
      </div>

      {topProducts.length === 0 ? (
        <div className="sin-productos">
          <p>No hay ventas registradas en este período</p>
        </div>
      ) : (
        <div className="top-products-table-container">
          <table className="top-products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio Unit.</th>
                <th>Unidades Vendidas</th>
                <th>Total Vendido</th>
                <th>Participación</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => {
                const totalGeneral = topProducts.reduce((sum, p) => sum + p.total_ingresos, 0);
                const participacion = (product.total_ingresos / totalGeneral * 100).toFixed(1);
                const barWidth = participacion;
                
                return (
                  <tr key={product.id} className={`rank-${index + 1}`}>
                    <td className="rank-cell">
                      <div className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {(index > 2) && `${index + 1}`}
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
                    <td className="categoria-cell">
                      <span className="categoria-tag">
                        {getCategoriaIcon(product.categoria)} {product.categoria || 'General'}
                      </span>
                    </td>
                    <td className="precio-cell">{formatCurrency(product.precio)}</td>
                    <td className="unidades-cell">
                      <div className="unidades-badge">
                        <FaBox className="unidades-icon" />
                        {product.total_vendido} uds
                      </div>
                    </td>
                    <td className="total-cell">{formatCurrency(product.total_ingresos)}</td>
                    <td className="participacion-cell">
                      <div className="participacion-bar">
                        <div 
                          className="participacion-fill" 
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="participacion-text">{participacion}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-footer-products">
                <td colSpan="4"><strong>Total General</strong></td>
                <td>
                  <strong>{topProducts.reduce((sum, p) => sum + p.total_vendido, 0)} uds</strong>
                </td>
                <td colSpan="2">
                  <strong>{formatCurrency(topProducts.reduce((sum, p) => sum + p.total_ingresos, 0))}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default TopProducts;
