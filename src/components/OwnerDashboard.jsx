import React from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
import DailySalesKPI from './DailySalesKPI';
import './OwnerDashboard.css';

function OwnerDashboard({ usuario, cerrarSesion, actualizarInventario, mensajeInventario, inventario }) {
  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>👑 Panel del Dueño</h1>
        <div className="header-buttons">
          <button onClick={cerrarSesion} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>
      
      {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}
      
      {/* Fila de KPIs de stock bajo */}
      <div className="kpis-grid">
        <StockBajoKPI inventario={inventario} actualizarInventario={actualizarInventario} />
      </div>
      
      {/* Layout de dos columnas */}
      <div className="dashboard-two-columns">
        {/* Columna izquierda: Gestión de Inventario */}
        <div className="column-left">
          <div className="dashboard-card inventory-card">
            <InventoryPanel />
          </div>
        </div>
        
        {/* Columna derecha: Reportes y Ventas en Tiempo Real */}
        <div className="column-right">
          <div className="dashboard-card sales-card">
            <SalesReports />
            {/* KPI de ventas diarias debajo del gráfico */}
            <DailySalesKPI />
          </div>
          <div className="dashboard-card realtime-card">
            <RealtimeSales />
          </div>
        </div>
      </div>
      
      {/* Sección de Productos Más Vendidos a ancho completo */}
      <div className="dashboard-card top-products-full">
        <TopProducts />
      </div>
    </div>
  );
}

export default OwnerDashboard;
