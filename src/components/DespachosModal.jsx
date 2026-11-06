import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import './DespachosModal.css';

// Fecha fija de Colombia (evita que pase al día siguiente después de las 7:00 PM)
const getFechaColombia = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
};

function DespachosModal({ onClose, inventario = [] }) {
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaColombia());
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const mapaProductos = useMemo(() => {
    const mapa = {};
    (inventario || []).forEach((p) => {
      mapa[p.id] = {
        nombre: p.subcategoria || p.nombre || `Producto #${p.id}`,
        precio: Number(p.precio) || 0
      };
    });
    return mapa;
  }, [inventario]);

  useEffect(() => {
    cargarDespachos();
  }, [fechaSeleccionada]);

  const cargarDespachos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/despachos`, {
        params: { fecha: fechaSeleccionada }
      });
      setDespachos(response.data || []);
    } catch (err) {
      console.error('Error cargando despachos:', err);
      setError('No se pudieron cargar los despachos');
    } finally {
      setLoading(false);
    }
  };

  const formatearHora = (fechaTimestamp) => {
    if (!fechaTimestamp) return '';
    try {
      return new Date(fechaTimestamp).toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const filas = useMemo(() => {
    return despachos.map((d) => {
      const info = mapaProductos[d.producto_id] || {
        nombre: `Producto #${d.producto_id}`,
        precio: 0
      };
      const cantidad = Number(d.cantidad) || 0;
      const valorTotal = info.precio * cantidad;
      return {
        ...d,
        nombreProducto: info.nombre,
        precio: info.precio,
        cantidadNum: cantidad,
        valorTotal
      };
    });
  }, [despachos, mapaProductos]);

  const totalDespachado = filas.reduce((sum, d) => sum + d.cantidadNum, 0);
  const totalValorDespachado = filas.reduce((sum, d) => sum + d.valorTotal, 0);

  return (
    <div className="despachos-modal-overlay" onClick={onClose}>
      <div className="despachos-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="despachos-modal-header">
          <h2>📦 DESPACHOS DIARIOS</h2>
          <button className="despachos-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="despachos-modal-body">
          <div className="despachos-fecha-selector">
            <label>
              Fecha:
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
            </label>
            <button onClick={cargarDespachos} className="btn-refresh-despachos">
              🔄 Actualizar
            </button>
          </div>

          {error && <div className="despachos-error">{error}</div>}

          {loading ? (
            <div className="despachos-loading">Cargando despachos...</div>
          ) : filas.length === 0 ? (
            <div className="despachos-vacio">
              <p>No hay despachos registrados para esta fecha ({fechaSeleccionada})</p>
            </div>
          ) : (
            <>
              <div className="despachos-resumen">
                <span className="despachos-total">
                  Total paquetes: <strong>{totalDespachado} und.</strong>
                </span>
                <span className="despachos-valor-resumen">
                  Valor Total: <strong>{formatPrice(totalValorDespachado)}</strong>
                </span>
              </div>

              <div className="despachos-modal-table-wrap">
                <table className="despachos-modal-table">
                  <thead>
                    <tr>
                      <th>NOMBRE DEL PRODUCTO</th>
                      <th className="num-col">PRECIO</th>
                      <th className="center-col">CANTIDAD</th>
                      <th className="num-col">VALOR TOTAL</th>
                      <th className="center-col">REGISTRADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((d, index) => {
                      const hora = formatearHora(d.fecha_cierre || d.created_at);
                      return (
                        <tr key={d.id || index}>
                          <td>
                            <div className="modal-prod-nombre">{d.nombreProducto}</div>
                            {d.observaciones && (
                              <div className="modal-prod-obs">📝 {d.observaciones}</div>
                            )}
                          </td>
                          <td className="num-col">{formatPrice(d.precio)}</td>
                          <td className="center-col modal-cant-strong">{d.cantidadNum}</td>
                          <td className="num-col modal-valor-strong">{formatPrice(d.valorTotal)}</td>
                          <td className="center-col modal-fecha-col">
                            <span>{d.fecha || fechaSeleccionada}</span>
                            {hora && <small>{hora}</small>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="modal-total-row">
                      <td>TOTAL DESPACHO</td>
                      <td className="num-col">—</td>
                      <td className="center-col">{totalDespachado}</td>
                      <td className="num-col modal-total-valor">{formatPrice(totalValorDespachado)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="despachos-modal-footer">
          <button onClick={onClose} className="btn-cerrar-despachos">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DespachosModal;
