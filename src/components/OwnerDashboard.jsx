import React from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './services/RealtimeSales';
import TopProducts from './TopProducts';
import './OwnerDashboard.css';

function OwnerDashboard({ usuario, cerrarSesion }) {
  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>Panel del Dueño</h1>
        <button onClick={cerrarSesion}>Cerrar Sesión</button>
      </header>
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
