import React, { useState } from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
import DailySalesKPI from './DailySalesKPI';
import VentasAcumuladas from './VentasAcumuladas';
import DespachosPanel from './DespachosPanel';
import CuadresLista from './CuadresLista';
import AnalisisInventario from './AnalisisInventario';
import './OwnerDashboard.css';

// ============================================================
//  MODO: 'pos' o 'fabrica'
// ============================================================
const MODO = (import.meta.env.VITE_MODO || 'pos').toLowerCase();
const esFabrica = MODO === 'fabrica';

function OwnerDashboard({ usuario, cerrarSesion, actualizarInventario, mensajeInventario, inventario }) {
  const [tabActiva, setTabActiva] = useState('dashboard');

  // ===== TABS BASE (comunes en tienda y fábrica) =====
  const tabsBase = [
    { 
      id: 'dashboard', 
      label: '📊 Dashboard', 
      component: (
        <>
          {!esFabrica && (
            <StockBajoKPI inventario={inventario} actualizarInventario={actualizarInventario} />
          )}
          <DailySalesKPI />
        </>
      )
    },
    { 
      id: 'top', 
      label: '🏆 Top Productos', 
      component: <TopProducts /> 
    },
    { 
      id: 'ventas', 
      label: '📈 Ventas', 
      component: (
        <>
          <SalesReports />
          <VentasAcumuladas />
        </>
      )
    },
    { 
      id: 'tiempo-real', 
      label: '🔄 Tiempo Real', 
      component: <RealtimeSales /> 
    },
    { 
      id: 'cuadres', 
      label: '📋 Cuadres', 
      component: <CuadresLista /> 
    }
  ];

  // ===== TABS EXCLUSIVAS DEL POS (no se muestran en fábrica) =====
  const tabsSoloPOS = [
    { 
      id: 'inventario', 
      label: '📦 Inventario', 
      component: (
        <InventoryPanel 
          inventario={inventario}
          actualizarInventario={actualizarInventario}
        />
      ) 
    },
    { 
      id: 'despachos', 
      label: '📦 Despachos', 
      component: (
        <DespachosPanel 
          inventario={inventario} 
          usuario={usuario} 
          actualizarInventario={actualizarInventario}
        />
      ) 
    },
    { 
      id: 'analisis-inventario', 
      label: '📊 Análisis Inventario', 
      component: <AnalisisInventario usuario={usuario} />
    }
  ];

  // ===== CONSTRUIR ARRAY DE TABS SEGÚN EL MODO =====
  const tabs = esFabrica
    ? tabsBase
    : [
        tabsBase[0],       // dashboard
        tabsSoloPOS[0],    // inventario
        tabsBase[1],       // top
        tabsBase[2],       // ventas
        tabsBase[3],       // tiempo-real
        tabsSoloPOS[1],    // despachos
        tabsBase[4],       // cuadres
        tabsSoloPOS[2]     // análisis inventario
      ];

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>{esFabrica ? '👑 Panel de la Fábrica' : '👑 Panel del Dueño'}</h1>
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
