import React from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
import DailySalesKPI from './DailySalesKPI';
import VentasAcumuladas from './VentasAcumuladas';
import DespachosPanel from './DespachosPanel';
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
      
      <StockBajoKPI inventario={inventario} actualizarInventario={actualizarInventario} />
      
      <div className="dashboard-two-columns">
        <div className="column-left">
          <div className="dashboard-card inventory-card">
            <InventoryPanel />
          </div>
          <div className="dashboard-card top-products-card">
            <TopProducts />
          </div>
        </div>
        
        <div className="column-right">
          <div className="dashboard-card sales-card">
            <SalesReports />
            <DailySalesKPI />
          </div>
          
          <div className="dashboard-card realtime-card">
            <RealtimeSales />
          </div>
          
          {/* Ventas Acumuladas - tarjeta independiente */}
          <div className="dashboard-card">
            <VentasAcumuladas />
          </div>
          
          {/* Despachos Panel - tarjeta independiente */}
          <div className="dashboard-card">
            <DespachosPanel inventario={inventario} usuario={usuario} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
