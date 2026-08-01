import React, { useState } from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
import DailySalesKPI from './DailySalesKPI';
import VentasAcumuladas from './VentasAcumuladas';
import DespachosPanel from './DespachosPanel';
import CuadresLista from './CuadresLista';  // 👈 Importar el nuevo componente
import './OwnerDashboard.css';

function OwnerDashboard({ usuario, cerrarSesion, actualizarInventario, mensajeInventario, inventario }) {
  const [tabActiva, setTabActiva] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', component: (
      <>
        <StockBajoKPI inventario={inventario} actualizarInventario={actualizarInventario} />
        <DailySalesKPI />
      </>
    )},
    { id: 'inventario', label: '📦 Inventario', component: <InventoryPanel /> },
    { id: 'top', label: '🏆 Top Productos', component: <TopProducts /> },
    { id: 'ventas', label: '📈 Ventas', component: (
      <>
        <SalesReports />
        <VentasAcumuladas />
      </>
    )},
    { id: 'tiempo-real', label: '🔄 Tiempo Real', component: <RealtimeSales /> },
    { id: 'despachos', label: '📦 Despachos', component: <DespachosPanel inventario={inventario} usuario={usuario} /> },
    // 👇 Nueva pestaña: Historial de Cuadres de Caja
    { id: 'cuadres', label: '📋 Cuadres', component: <CuadresLista /> }
  ];

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>👑 Panel del Dueño</h1>
        <div className="header-buttons">
          <button onClick={cerrarSesion} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>
      
      {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}
      
      {/* Pestañas */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${tabActiva === tab.id ? 'active' : ''}`}
            onClick={() => setTabActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Contenido de la pestaña activa */}
      <div className="tab-content">
        {tabs.find(t => t.id === tabActiva)?.component}
      </div>
    </div>
  );
}

export default OwnerDashboard;
