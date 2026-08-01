import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaMoneyBillWave, FaCreditCard, FaChartBar } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatFechaColombia } from '../utils/dateUtils';
import './OwnerDashboard.css';

function CuadresLista() {
  const [cuadres, setCuadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [totales, setTotales] = useState({
    total_efectivo: 0,
    total_transferencia: 0,
    total_ventas: 0
  });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarCuadres();
  }, []);

  const cargarCuadres = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/cuadres`;
      if (filtroFecha) {
        url += `?fecha_inicio=${filtroFecha}&fecha_fin=${filtroFecha}`;
      }
      const response = await axios.get(url);
      const data = response.data || [];
      setCuadres(data);
      calcularTotales(data);
    } catch (error) {
      console.error('Error cargando cuadres:', error);
      alert('Error al cargar los cuadres de caja');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = (data) => {
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalVentas = 0;
    data.forEach(c => {
      totalEfectivo += c.efectivo_contado || 0;
      totalTransferencia += c.transferencia_contada || 0;
      totalVentas += c.total_ventas_sistema || 0;
    });
    setTotales({
      total_efectivo: totalEfectivo,
      total_transferencia: totalTransferencia,
      total_ventas: totalVentas
    });
  };

  const handleFiltrar = () => {
    cargarCuadres();
  };

  const handleLimpiar = () => {
    setFiltroFecha('');
    setTimeout(cargarCuadres, 100);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    return formatFechaColombia(fechaStr);
  };

  if (loading) {
    return (
      <div className="cuadres-lista">
        <h3>📋 Historial de Cuadres de Caja</h3>
        <div className="loading-state">Cargando cuadres...</div>
      </div>
    );
  }

  return (
    <div className="cuadres-lista">
      <div className="cuadres-header">
        <h3>📋 Historial de Cuadres de Caja</h3>
        <div className="cuadres-filtros">
          <label>
            Fecha:
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </label>
          <button onClick={handleFiltrar} className="btn-filtrar-cuadres">
            <FaSearch /> Filtrar
          </button>
          <button onClick={handleLimpiar} className="btn-limpiar-cuadres">
            Limpiar
          </button>
        </div>
      </div>

      {cuadres.length === 0 ? (
        <div className="sin-cuadres">
          <p>No hay cuadres de caja registrados</p>
        </div>
      ) : (
        <>
          <div className="cuadres-tabla-container">
            <table className="cuadres-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cajero</th>
                  <th>Total Ventas (Sistema)</th>
                  <th>Efectivo Contado</th>
                  <th>Transferencia Contada</th>
                  <th>Diferencia Efectivo</th>
                  <th>Diferencia Transferencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuadres.map((c) => (
                  <tr key={c.id}>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>{c.cajero_id || 'N/A'}</td>
                    <td>{formatPrice(c.total_ventas_sistema || 0)}</td>
                    <td>{formatPrice(c.efectivo_contado || 0)}</td>
                    <td>{formatPrice(c.transferencia_contada || 0)}</td>
                    <td className={c.diferencia_efectivo === 0 ? 'exacto' : c.diferencia_efectivo > 0 ? 'sobrante' : 'faltante'}>
                      {formatPrice(c.diferencia_efectivo || 0)}
                    </td>
                    <td className={c.diferencia_transferencia === 0 ? 'exacto' : c.diferencia_transferencia > 0 ? 'sobrante' : 'faltante'}>
                      {formatPrice(c.diferencia_transferencia || 0)}
                    </td>
                    <td>
                      <span className={`estado-badge ${c.estado || 'cerrado'}`}>
                        {c.estado === 'cerrado' ? '✅ Cerrado' : '🔄 Abierto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totales-row">
                  <td colSpan="2"><strong>TOTALES</strong></td>
                  <td><strong>{formatPrice(totales.total_ventas)}</strong></td>
                  <td><strong>{formatPrice(totales.total_efectivo)}</strong></td>
                  <td><strong>{formatPrice(totales.total_transferencia)}</strong></td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="cuadres-resumen">
            <div className="resumen-card">
              <div className="resumen-icon"><FaMoneyBillWave /></div>
              <div className="resumen-info">
                <span className="label">Total Efectivo Contado</span>
                <span className="value">{formatPrice(totales.total_efectivo)}</span>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon"><FaCreditCard /></div>
              <div className="resumen-info">
                <span className="label">Total Transferencia Contada</span>
                <span className="value">{formatPrice(totales.total_transferencia)}</span>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon"><FaChartBar /></div>
              <div className="resumen-info">
                <span className="label">Venta Total del Día</span>
                <span className="value">{formatPrice(totales.total_ventas)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CuadresLista;
