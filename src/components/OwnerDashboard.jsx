import React from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
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
      
      {/* Fila de KPIs */}
      <div className="kpis-grid">
        <StockBajoKPI inventario={inventario} actualizarInventario={actualizarInventario} />
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card inventory-card">
          <InventoryPanel />
        </div>
        <div className="dashboard-card sales-card">
          <SalesReports />
        </div>
        <div className="dashboard-card realtime-card">
          <RealtimeSales />
        </div>
        <div className="dashboard-card top-products-card">
          <TopProducts />
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
