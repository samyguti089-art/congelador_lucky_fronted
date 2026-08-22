// src/utils/dateUtils.js

/**
 * Parsea una fecha ISO o timestamp con/sin zona horaria.
 * - Si ya trae zona (Z o ±HH:MM), la usa directamente.
 * - Si no trae zona, asume que es hora local de Bogotá (UTC-5).
 */
const parseFecha = (fechaISO) => {
  if (!fechaISO) return null;

  // Si es un objeto Date, lo devolvemos tal cual
  if (fechaISO instanceof Date) return fechaISO;

  const str = String(fechaISO).trim();

  // Si ya incluye zona horaria (Z o +HH:MM o -HH:MM)
  if (/Z$|[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(str);
  }

  // Si no tiene zona, asumimos que es hora local de Bogotá
  // y agregamos el offset -05:00 (Colombia no maneja horario de verano)
  const fechaLimpia = str.replace(' ', 'T');
  return new Date(fechaLimpia + '-05:00');
};

/**
 * Formatea fecha y hora en formato Colombia.
 * @param {string|Date} fechaISO
 * @returns {string} Ej: '21/08/2026, 8:21 p. m.'
 */
export const formatFechaColombia = (fechaISO) => {
  const fecha = parseFecha(fechaISO);
  if (!fecha) return '-';
  return fecha.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium'
  });
};

/**
 * Formatea solo la hora en formato Colombia.
 * @param {string|Date} fechaISO
 * @returns {string} Ej: '8:21 p. m.'
 */
export const formatHoraColombia = (fechaISO) => {
  const fecha = parseFecha(fechaISO);
  if (!fecha) return '-';
  return fecha.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit'
  });
};
