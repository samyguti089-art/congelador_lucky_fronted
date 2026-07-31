// src/utils/dateUtils.js

/**
 * Formatea una fecha ISO a formato corto con hora Colombia (UTC-5)
 * @param {string} fechaISO - Fecha en formato ISO (ej: '2026-07-30T02:11:00')
 * @returns {string} - Fecha formateada (ej: '30/07/2026 09:11 p. m.')
 */
export const formatFechaColombia = (fechaISO) => {
  if (!fechaISO) return '-';
  // Forzar que la fecha se interprete como UTC
  const fechaUTC = new Date(fechaISO + 'Z'); // Agregar 'Z' para indicar UTC
  return fechaUTC.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium'
  });
};

/**
 * Formatea solo la hora en formato Colombia (UTC-5)
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} - Hora formateada (ej: '09:11 p. m.')
 */
export const formatHoraColombia = (fechaISO) => {
  if (!fechaISO) return '-';
  // Forzar que la fecha se interprete como UTC
  const fechaUTC = new Date(fechaISO + 'Z');
  return fechaUTC.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit'
  });
};
