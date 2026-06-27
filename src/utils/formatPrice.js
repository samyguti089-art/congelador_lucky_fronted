// src/utils/format.js
export const formatPrice = (value) => {
  if (value === undefined || value === null) return '$0';
  return `$${Number(value).toLocaleString('es-CO')}`;
};
