import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabaseClient';
import { FaSearch, FaMoneyBillWave, FaCreditCard, FaChartBar } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatFechaColombia } from '../utils/dateUtils';
import './OwnerDashboard.css';

function CuadresLista() {
  const [cuadres, setCuadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modoFiltro, setModoFiltro] = useState('mes'); // 'mes' o 'rango'
  const [totales, setTotales] = useState({
    total_efectivo: 0,
    total_transferencia: 0,
    total_ventas: 0
  });

  const [cuadreSeleccionado, setCuadreSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [ventasEfectivo, setVentasEfectivo] = useState([]);
  const [ventasTransferencia, setVentasTransferencia] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarCuadres();
  }, [mesActual, modoFiltro]);

  const cargarCuadres = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/cuadres`;
      if (modoFiltro === 'mes' && mesActual) {
        const [year, month] = mesActual.split('-');
        const primerDia = `${year}-${month}-01`;
        const ultimoDia = new Date(year, month, 0).getDate();
        const finMes = `${year}-${month}-${String(ultimoDia).padStart(2, '0')}`;
        url += `?fecha_inicio=${primerDia}&fecha_fin=${finMes}`;
      } else if (modoFiltro === 'rango' && fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
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

  const handleFiltrar = () => cargarCuadres();

  const handleLimpiar = () => {
    setFechaInicio('');
    setFechaFin('');
    setModoFiltro('mes');
    const hoy = new Date();
    setMesActual(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    if (fechaStr.length === 10) {
      const [year, month, day] = fechaStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return formatFechaColombia(fechaStr);
  };

  const verDetalleCuadre = async (cuadre) => {
    setCuadreSeleccionado(cuadre);
    setMostrarDetalle(true);
    setCargandoDetalle(true);

    try {
      const fechaStr = cuadre.fecha;
      const [year, month, day] = fechaStr.split('-').map(Number);
      const inicioUTC = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
      const finUTC = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59));
      const inicio = inicioUTC.toISOString();
      const fin = finUTC.toISOString();

      const { data: ventas, error } = await supabase
        .from('ventas_cabecera')
        .select('id_venta, total_venta, metodo_pago, monto_efectivo, monto_transferencia')
        .eq('cajero_id', cuadre.cajero_id)
        .gte('fecha', inicio)
        .lte('fecha', fin)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const efectivo = [];
      const transferencia = [];
      ventas.forEach(v => {
        if (v.metodo_pago === 'efectivo') efectivo.push(v.total_venta);
        else if (v.metodo_pago === 'transferencia') transferencia.push(v.total_venta);
        else if (v.metodo_pago === 'compartida') {
          efectivo.push(v.monto_efectivo || 0);
          transferencia.push(v.monto_transferencia || 0);
        }
      });

      setVentasEfectivo(efectivo);
      setVentasTransferencia(transferencia);
    } catch (err) {
      console.error('Error cargando detalle del cuadre:', err);
      alert('Error al cargar el detalle del cuadre: ' + err.message);
    } finally {
      setCargandoDetalle(false);
    }
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
          <div className="modo-filtro">
            <button
              className={modoFiltro === 'mes' ? 'active' : ''}
              onClick={() => setModoFiltro('mes')}
            >
              Por mes
            </button>
            <button
              className={modoFiltro === 'rango' ? 'active' : ''}
              onClick={() => setModoFiltro('rango')}
            >
              Por rango
            </button>
          </div>

          {modoFiltro === 'mes' ? (
            <label>
              Mes:
              <input
                type="month"
                value={mesActual}
                onChange={(e) => setMesActual(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                Desde:
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </label>
              <label>
                Hasta:
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </label>
            </>
          )}

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
          <p>No hay cuadres de caja registrados para este período</p>
        </div>
      ) : (
        <>
          <div className="cuadres-tabla-container">
            <table className="cuadres-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cajero</th>
                  <th>Base</th>
                  <th>Total Ventas</th>
                  <th>Efectivo Contado</th>
                  <th>Transferencia Contada</th>
                  <th>Dif. Efectivo</th>
                  <th>Dif. Transferencia</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuadres.map((c) => (
                  <tr key={c.id}>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>{c.cajero_id || 'N/A'}</td>
                    <td className="base-cell">{formatPrice(c.base || 0)}</td>
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
                    <td>
                      <button
                        className="btn-ver-detalle"
                        onClick={() => verDetalleCuadre(c)}
                      >
                        📋 Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totales-row">
                  <td colSpan="3"><strong>TOTALES</strong></td>
                  <td><strong>{formatPrice(totales.total_ventas)}</strong></td>
                  <td><strong>{formatPrice(totales.total_efectivo)}</strong></td>
                  <td><strong>{formatPrice(totales.total_transferencia)}</strong></td>
                  <td colSpan="4"></td>
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
                <span className="label">Venta Total del Período</span>
                <span className="value">{formatPrice(totales.total_ventas)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {mostrarDetalle && cuadreSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarDetalle(false)}>
          <div className="modal-content detalle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detalle del Cuadre</h2>
              <button className="close-btn" onClick={() => setMostrarDetalle(false)}>✕</button>
            </div>
            <div className="modal-body detalle-body">
              <div className="detalle-resumen-cuadre">
                <p><strong>Fecha:</strong> {formatearFecha(cuadreSeleccionado.fecha)}</p>
                <p><strong>Cajero:</strong> {cuadreSeleccionado.cajero_id || 'N/A'}</p>
                <p><strong>Base para el siguiente día:</strong> {formatPrice(cuadreSeleccionado.base || 0)}</p>
                <p><strong>Total Ventas:</strong> {formatPrice(cuadreSeleccionado.total_ventas_sistema)}</p>
              </div>

              {cargandoDetalle ? (
                <div className="loading-state">Cargando detalle...</div>
              ) : (
                <div className="detalle-dos-columnas">
                  <div className="columna-efectivo">
                    <h4>💵 Efectivo</h4>
                    {ventasEfectivo.length === 0 ? (
                      <p className="sin-ventas">No hay ventas en efectivo</p>
                    ) : (
                      <>
                        <div className="lista-valores">
                          {ventasEfectivo.map((monto, idx) => (
                            <div key={idx} className="valor-item">
                              {formatPrice(monto)}
                            </div>
                          ))}
                        </div>
                        <div className="total-columna">
                          <strong>Total Efectivo:</strong> {formatPrice(ventasEfectivo.reduce((a, b) => a + b, 0))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="columna-transferencia">
                    <h4>💳 Transferencia</h4>
                    {ventasTransferencia.length === 0 ? (
                      <p className="sin-ventas">No hay ventas en transferencia</p>
                    ) : (
                      <>
                        <div className="lista-valores">
                          {ventasTransferencia.map((monto, idx) => (
                            <div key={idx} className="valor-item">
                              {formatPrice(monto)}
                            </div>
                          ))}
                        </div>
                        <div className="total-columna">
                          <strong>Total Transferencia:</strong> {formatPrice(ventasTransferencia.reduce((a, b) => a + b, 0))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CuadresLista;
