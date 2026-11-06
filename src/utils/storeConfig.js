// ============================================================
// CONFIGURACION DE SEDE / PUNTO DE VENTA
// ============================================================
// El despliegue principal usa VITE_MODO='pos' (Congelados Lucky)
// El segundo despliegue (antes 'fabrica') opera ahora como el
// nuevo punto de venta completo: "Congelados Lucky 3.0"
// ============================================================

const rawModo = (import.meta.env.VITE_MODO || 'pos').toLowerCase().trim();

export const esPuntoLucky3 =
  rawModo === 'fabrica' ||
  rawModo === 'lucky3' ||
  rawModo === 'lucky_3' ||
  rawModo === '3.0';

export const STORE_NAME = esPuntoLucky3
  ? 'Congelados Lucky 3.0'
  : 'Congelados Lucky';

export const STORE_TITLE_UPPER = esPuntoLucky3
  ? 'CONGELADOS LUCKY 3.0'
  : 'CONGELADOR LUCKY';

export const POS_BADGE_TEXT = esPuntoLucky3
  ? 'Lucky 3.0 • Punto de Venta'
  : 'Punto de Venta';

export const OWNER_SUBTITLE = esPuntoLucky3
  ? 'Sede 3.0 • Panel del dueño'
  : 'Panel del dueño';
