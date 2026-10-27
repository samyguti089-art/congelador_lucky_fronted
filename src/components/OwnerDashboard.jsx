import React, { useEffect, useState } from 'react';
import InventoryPanel from './InventoryPanel';
import SalesReports from './SalesReports';
import RealtimeSales from './RealtimeSales';
import TopProducts from './TopProducts';
import StockBajoKPI from './StockBajoKPI';
import DailySalesKPI from './DailySalesKPI';
import VentasAcumuladas from './VentasAcumuladas';
import DespachosPanel from './DespachosPanel';
import CuadresLista from './CuadresLista';
import KardexPanel from './KardexPanel';
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiPackage,
  FiTruck
} from 'react-icons/fi';
import luckyLogo from './images/logo.jpeg';
import './OwnerDashboard.css';

// ============================================================
// MODO: 'pos' o 'fabrica'
// ============================================================
const MODO = (import.meta.env.VITE_MODO || 'pos').toLowerCase();
const esFabrica = MODO === 'fabrica';

function OwnerDashboard({ usuario, cerrarSesion, actualizarInventario, mensajeInventario, inventario }) {
  const [tabActiva, setTabActiva] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    return localStorage.getItem('owner-sidebar-collapsed') !== 'false';
  });

  const alternarSidebar = () => {
    setSidebarColapsado((colapsado) => {
      const siguiente = !colapsado;
      localStorage.setItem('owner-sidebar-collapsed', String(siguiente));
      return siguiente;
    });
  };

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setMenuAbierto(false);
    };
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowOriginal;
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [menuAbierto]);

  // ===== TABS BASE (comunes en tienda y fábrica) =====
  const tabsBase = [
    { 
      id: 'dashboard', 
      title: 'Resumen de hoy',
      label: 'Resumen',
      icon: FiGrid,
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
      title: 'Top Productos',
      label: 'Más vendidos',
      icon: FiAward,
      component: <TopProducts /> 
    },
    { 
      id: 'ventas', 
      title: 'Reportes de ventas',
      label: 'Ventas',
      icon: FiBarChart2,
      component: (
        <>
          <SalesReports />
          <VentasAcumuladas />
        </>
      )
    },
    { 
      id: 'tiempo-real', 
      title: 'Ventas en tiempo real',
      label: 'Tiempo real',
      icon: FiActivity,
      component: <RealtimeSales /> 
    },
    { 
      id: 'cuadres', 
      title: 'Cuadres',
      label: 'Cuadres',
      icon: FiClipboard,
      component: <CuadresLista /> 
    }
  ];

  // ===== TABS EXCLUSIVAS DEL POS (TIENDA) =====
  const tabsSoloPOS = [
    { 
      id: 'inventario', 
      title: 'Inventario',
      label: 'Inventario',
      icon: FiPackage,
      component: (
        <InventoryPanel 
          inventario={inventario}
          actualizarInventario={actualizarInventario}
        />
      ) 
    },
    { 
      id: 'despachos', 
      title: 'Despachos',
      label: 'Despachos',
      icon: FiTruck,
      component: (
        <DespachosPanel 
          inventario={inventario} 
          usuario={usuario} 
          actualizarInventario={actualizarInventario}
        />
      ) 
    },
    { 
      id: 'kardex', 
      title: 'Kardex Stock',
      label: 'Kardex',
      icon: FiLayers,
      component: <KardexPanel inventario={inventario} /> 
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
        tabsSoloPOS[2]     // kardex stock
      ];

  const pestanaActual = tabs.find(tab => tab.id === tabActiva) || tabs[0];
  const fechaActual = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota'
  }).format(new Date());

  return (
    <div className={`owner-shell ${sidebarColapsado ? 'sidebar-collapsed' : ''}`}>
      <header className="owner-mobile-header">
        <div className="owner-brand">
          <img className="owner-brand-logo" src={luckyLogo} alt="" />
          <span className="owner-brand-copy">
            <strong>Congelados Lucky</strong>
            <small>{esFabrica ? 'Panel de fábrica' : 'Panel del dueño'}</small>
          </span>
        </div>

        <button
          type="button"
          className={`owner-menu-toggle ${menuAbierto ? 'is-open' : ''}`}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="owner-mobile-nav"
          onClick={() => setMenuAbierto(abierto => !abierto)}
        >
          <span className="owner-menu-lines" aria-hidden="true"><i /><i /><i /></span>
        </button>
      </header>

      <button
        type="button"
        className={`owner-sidebar-backdrop ${menuAbierto ? 'is-visible' : ''}`}
        aria-label="Cerrar menú"
        tabIndex={menuAbierto ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />

      <aside className={`owner-sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <button
          type="button"
          className="owner-brand owner-brand-toggle"
          onClick={alternarSidebar}
          aria-label={sidebarColapsado ? 'Expandir menú' : 'Contraer menú'}
          title={sidebarColapsado ? 'Expandir menú' : 'Contraer menú'}
        >
          <img className="owner-brand-logo" src={luckyLogo} alt="" />
          <span className="owner-brand-copy">
            <strong>Congelados Lucky</strong>
            <small>{esFabrica ? 'Panel de fábrica' : 'Panel del dueño'}</small>
          </span>
        </button>

        <nav id="owner-mobile-nav" className="tabs-container owner-navigation" aria-label="Secciones del panel">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn owner-nav-btn ${tabActiva === tab.id ? 'active' : ''}`}
                aria-current={tabActiva === tab.id ? 'page' : undefined}
                onClick={() => {
                  setTabActiva(tab.id);
                  setMenuAbierto(false);
                }}
              >
                <Icon className="owner-nav-icon" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" onClick={() => {
          setMenuAbierto(false);
          cerrarSesion();
        }} className="logout-btn">
          <FiLogOut aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      <main className="owner-main">
        <header className="owner-page-header">
          <div className="owner-heading-group">
            <h1>{pestanaActual.title}</h1>
          </div>
          {tabActiva === 'dashboard' && (
            <div className="owner-date-badge">
              <FiCalendar aria-hidden="true" />
              <span>{fechaActual}</span>
            </div>
          )}
        </header>

        {mensajeInventario && <div className="inventory-message">{mensajeInventario}</div>}

        <section className="tab-content owner-content">
          {pestanaActual.component}
        </section>
      </main>
    </div>
  );
}

export default OwnerDashboard;
