import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/format';
import './OwnerDashboard.css';

function VentasAcumuladas() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rangoSeleccionado, setRangoSeleccionado] = useState('30dias');

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Por defecto: últimos 30 días
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    setFechaFin(fin.toISOString().split('T')[0]);
    setFechaInicio(inicio.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ventas/acumuladas`, {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      });
      setDatos(response.data);
    } catch (error) {
      console.error('Error cargando ventas acumuladas:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cambiarRango = (dias) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    setFechaFin(fin.toISOString().split('T')[0]);
    setFechaInicio(inicio.toISOString().split('T')[0]);
    setRangoSeleccionado(`${dias}dias`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-state">Cargando ventas acumuladas...</div>;
  }

  return (
    <div className="ventas-acumuladas">
      <h3>📈 Ventas Acumuladas</h3>

      <div className="rango-buttons">
        <button 
          className={rangoSeleccionado === '7dias' ? 'active' : ''} 
          onClick={() => cambiarRango(7)}
        >
          Última semana
        </button>
        <button 
          className={rangoSeleccionado === '15dias' ? 'active' : ''} 
          onClick={() => cambiarRango(15)}
        >
          15 días
        </button>
        <button 
          className={rangoSeleccionado === '30dias' ? 'active' : ''} 
          onClick={() => cambiarRango(30)}
        >
          30 días
        </button>
        <button 
          className={rangoSeleccionado === '90dias' ? 'active' : ''} 
          onClick={() => cambiarRango(90)}
        >
          90 días
        </button>
      </div>

      <div className="tabla-container">
        <table className="ventas-acumuladas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ventas del día</th>
              <th>Total acumulado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((row, index) => (
              <tr key={index} className={row.total_dia === 0 ? 'dia-sin-ventas' : ''}>
                <td>{formatearFecha(row.fecha)}</td>
                <td>
                  {row.total_dia === 0 ? (
                    <span className="sin-ventas-msg">No se registraron ventas en este día</span>
                  ) : (
                    formatPrice(row.total_dia)
                  )}
                </td>
                <td className="acumulado-cell">{formatPrice(row.acumulado)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-footer-acumulado">
              <td><strong>Total general</strong></td>
              <td>
                <strong>
                  {formatPrice(datos.reduce((sum, row) => sum + row.total_dia, 0))}
                </strong>
              </td>
              <td>
                <strong>
                  {datos.length > 0 ? formatPrice(datos[datos.length - 1].acumulado) : '$0'}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default VentasAcumuladas;
