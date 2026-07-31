// src/utils/dateUtils.js
export const formatFechaColombia = (fechaISO) => {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium'
  });
};

export const formatHoraColombia = (fechaISO) => {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit'
  });
};
