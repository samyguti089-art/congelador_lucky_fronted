import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaBox, FaClock } from 'react-icons/fa';
import './DespachosModal.css';

function DespachosModal({ onClose, inventario }) {
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

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

  // ===== OBTENER NOMBRE DEL PRODUCTO DESDE INVENTARIO =====
  const getProductoNombre = (productoId) => {
    if (!inventario) return `Producto #${productoId}`;
    const producto = inventario.find(p => p.id === productoId);
    return producto ? (producto.subcategoria || producto.nombre) : `Producto #${productoId}`;
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalDespachado = despachos.reduce((sum, d) => sum + d.cantidad, 0);

  return (
    <div className="despachos-modal-overlay" onClick={onClose}>
      <div className="despachos-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="despachos-modal-header">
          <h2>📥 Despachos del día</h2>
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
          ) : despachos.length === 0 ? (
            <div className="despachos-vacio">
              <p>No hay despachos registrados para esta fecha</p>
            </div>
          ) : (
            <>
              <div className="despachos-resumen">
                <span className="despachos-total">
                  Total: <strong>{totalDespachado} unidades</strong>
                </span>
                <span className="despachos-cantidad">
                  {despachos.length} despachos
                </span>
              </div>

              <div className="despachos-lista">
                {despachos.map((d, index) => (
                  <div key={d.id || index} className="despacho-item">
                    <div className="despacho-producto">
                      <FaBox className="despacho-icono" />
                      <span className="despacho-nombre">
                        {getProductoNombre(d.producto_id)}
                      </span>
                    </div>
                    <div className="despacho-detalles">
                      <span className="despacho-cantidad">+{d.cantidad} uds</span>
                      <span className="despacho-hora">
                        <FaClock className="hora-icono" />
                        {formatearHora(d.created_at)}
                      </span>
                    </div>
                    {d.observaciones && (
                      <div className="despacho-observacion">
                        📝 {d.observaciones}
                      </div>
                    )}
                  </div>
                ))}
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
