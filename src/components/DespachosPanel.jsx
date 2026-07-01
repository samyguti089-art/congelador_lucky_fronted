import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/formatPrice';
import './OwnerDashboard.css';

function DespachosPanel({ inventario, usuario }) {
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [totalHoy, setTotalHoy] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarDespachos();
  }, [fecha]);

  const cargarDespachos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/despachos`, {
        params: { fecha: fecha }
      });
      setDespachos(response.data || []);
      
      // Calcular total despachado hoy
      const total = response.data.reduce((sum, d) => sum + d.cantidad, 0);
      setTotalHoy(total);
    } catch (error) {
      console.error('Error cargando despachos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productoId || !cantidad || cantidad <= 0) {
      alert('Selecciona un producto y una cantidad válida');
      return;
    }

    try {
      await axios.post(`${API_URL}/despacho`, {
        producto_id: parseInt(productoId),
        cantidad: parseInt(cantidad),
        fecha: fecha,
        observaciones: observaciones || null,
        usuario_id: usuario.id
      });

      alert('✅ Despacho registrado correctamente');
      setProductoId('');
      setCantidad('');
      setObservaciones('');
      cargarDespachos();
      
      // Recargar inventario (si la función existe)
      if (window.location) {
        window.location.reload(); // Opcional: refrescar inventario
      }
    } catch (error) {
      console.error('Error registrando despacho:', error);
      alert('❌ Error al registrar despacho');
    }
  };

  const getProductoNombre = (id) => {
    const producto = inventario.find(p => p.id === id);
    return producto ? (producto.subcategoria || producto.nombre) : 'Producto no encontrado';
  };

  return (
    <div className="despachos-panel">
      <h3>📦 Despachos Diarios</h3>
      
      <div className="despacho-resumen">
        <div className="despacho-total-hoy">
          <span>Total despachado hoy</span>
          <strong>{totalHoy} unidades</strong>
        </div>
        <div className="despacho-fecha">
          <label>
            Fecha:
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="despacho-form">
        <div className="form-row">
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            required
          >
            <option value="">Seleccionar producto</option>
            {inventario.map((p) => (
              <option key={p.id} value={p.id}>
                {p.subcategoria || p.nombre} - Stock: {p.cantidad}
              </option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
            required
          />
          
          <button type="submit" className="btn-registrar-despacho">
            ➕ Registrar Despacho
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Observaciones (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="observaciones-input"
        />
      </form>

      <div className="despachos-lista">
        <h4>Historial de despachos</h4>
        {loading ? (
          <p className="loading-text">Cargando...</p>
        ) : despachos.length === 0 ? (
          <p className="sin-datos">No hay despachos registrados para esta fecha</p>
        ) : (
          <div className="tabla-container">
            <table className="despachos-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Observaciones</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {despachos.map((d) => (
                  <tr key={d.id}>
                    <td>{getProductoNombre(d.producto_id)}</td>
                    <td className="cantidad-cell">{d.cantidad}</td>
                    <td>{d.observaciones || '-'}</td>
                    <td className="hora-cell">
                      {new Date(d.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DespachosPanel;
