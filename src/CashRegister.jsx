import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { FaMoneyBillWave, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatPrice } from "./utils/formatPrice";
import './CashRegister.css';

function CashRegister({ usuario, inventario, onClose }) {
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumenVentas, setResumenVentas] = useState({
    total: 0,
    efectivo: 0,
    transferencia: 0,
    cantidad: 0
  });
  const [efectivoContado, setEfectivoContado] = useState('');
  const [transferenciaContada, setTransferenciaContada] = useState('');
  const [diferenciaEfectivo, setDiferenciaEfectivo] = useState(null);
  const [diferenciaTransferencia, setDiferenciaTransferencia] = useState(null);
  const [cuadreRealizado, setCuadreRealizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [fecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarVentasDelDia();
  }, []);

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
      // Obtener ventas del día agrupadas por método de pago
      const { data: ventas, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .gte('fecha', `${fecha} 00:00:00`)
        .lte('fecha', `${fecha} 23:59:59`)
        .eq('cajero_id', usuario.id);

      if (error) throw error;

      if (ventas && ventas.length > 0) {
        // Agrupar por método de pago
        const totalEfectivo = ventas
          .filter(v => v.metodo_pago === 'efectivo')
          .reduce((sum, v) => sum + v.total_venta, 0);
        const totalTransferencia = ventas
          .filter(v => v.metodo_pago === 'transferencia')
          .reduce((sum, v) => sum + v.total_venta, 0);

        setResumenVentas({
          total: totalEfectivo + totalTransferencia,
          efectivo: totalEfectivo,
          transferencia: totalTransferencia,
          cantidad: ventas.length
        });
        setVentasDelDia(ventas);
      } else {
        setResumenVentas({ total: 0, efectivo: 0, transferencia: 0, cantidad: 0 });
        setVentasDelDia([]);
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
      alert('Error al cargar las ventas del día');
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularDiferencias = () => {
    const efectivo = parseFloat(efectivoContado);
    const transferencia = parseFloat(transferenciaContada);
    if (isNaN(efectivo) || efectivo < 0) {
      alert('Ingresa un monto válido para efectivo');
      return;
    }
    if (isNaN(transferencia) || transferencia < 0) {
      alert('Ingresa un monto válido para transferencias');
      return;
    }

    const diffEfectivo = efectivo - resumenVentas.efectivo;
    const diffTransferencia = transferencia - resumenVentas.transferencia;

    setDiferenciaEfectivo(diffEfectivo);
    setDiferenciaTransferencia(diffTransferencia);
    setCuadreRealizado(true);
  };

  const handleGuardarCuadre = async () => {
    if (!cuadreRealizado) {
      alert('Primero debes calcular las diferencias');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        fecha: fecha,
        cajero_id: usuario.id,
        total_ventas_sistema: resumenVentas.total,
        total_efectivo_sistema: resumenVentas.efectivo,
        total_transferencia_sistema: resumenVentas.transferencia,
        efectivo_contado: parseFloat(efectivoContado),
        transferencia_contada: parseFloat(transferenciaContada),
        diferencia_efectivo: diferenciaEfectivo,
        diferencia_transferencia: diferenciaTransferencia,
        observaciones: observaciones
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/cuadre/guardar`, payload);
      console.log('Cuadre guardado:', response.data);
      alert('✅ Cuadre de caja guardado exitosamente');

      // Cerrar el modal y resetear estado
      onClose();
    } catch (error) {
      console.error('Error guardando cuadre:', error);
      alert('❌ Error al guardar el cuadre: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGuardando(false);
    }
  };

  const resetearCuadre = () => {
    setEfectivoContado('');
    setTransferenciaContada('');
    setDiferenciaEfectivo(null);
    setDiferenciaTransferencia(null);
    setCuadreRealizado(false);
    setObservaciones('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return <div className="cash-register-loading">Cargando datos del día...</div>;
  }

  return (
    <div className="cash-register-container">
      <div className="cash-register-header">
        <h2>💰 Cuadre de Caja</h2>
        <span className="fecha-badge">📅 {fecha}</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Resumen de Ventas */}
      <div className="ventas-resumen">
        <div className="resumen-item total">
          <span className="label">Total Ventas</span>
          <span className="value">{formatCurrency(resumenVentas.total)}</span>
        </div>
        <div className="resumen-item efectivo">
          <span className="label">💵 Efectivo (Sistema)</span>
          <span className="value">{formatCurrency(resumenVentas.efectivo)}</span>
        </div>
        <div className="resumen-item transferencia">
          <span className="label">💳 Transferencia (Sistema)</span>
          <span className="value">{formatCurrency(resumenVentas.transferencia)}</span>
        </div>
        <div className="resumen-item transacciones">
          <span className="label">Transacciones</span>
          <span className="value">{resumenVentas.cantidad}</span>
        </div>
      </div>

      {/* Cuadre de Efectivo */}
      <div className="cuadre-section">
        <h3>💵 Cuadre de Efectivo</h3>
        <div className="cuadre-input-group">
          <label>
            Efectivo contado físicamente:
            <input
              type="number"
              value={efectivoContado}
              onChange={(e) => setEfectivoContado(e.target.value)}
              placeholder="0"
              disabled={cuadreRealizado}
              step="100"
            />
          </label>
        </div>
        {cuadreRealizado && diferenciaEfectivo !== null && (
          <div className={`diferencia-resultado ${diferenciaEfectivo === 0 ? 'exacto' : diferenciaEfectivo > 0 ? 'sobrante' : 'faltante'}`}>
            {diferenciaEfectivo === 0 ? (
              <><FaCheckCircle /> <span>✅ Efectivo cuadra perfecto</span></>
            ) : diferenciaEfectivo > 0 ? (
              <><FaExclamationTriangle /> <span>Sobrante en efectivo: {formatCurrency(diferenciaEfectivo)}</span></>
            ) : (
              <><FaExclamationTriangle /> <span>Faltante en efectivo: {formatCurrency(Math.abs(diferenciaEfectivo))}</span></>
            )}
          </div>
        )}
      </div>

      {/* Cuadre de Transferencias */}
      <div className="cuadre-section">
        <h3>💳 Cuadre de Transferencias</h3>
        <div className="cuadre-input-group">
          <label>
            Transferencias contadas (comprobantes):
            <input
              type="number"
              value={transferenciaContada}
              onChange={(e) => setTransferenciaContada(e.target.value)}
              placeholder="0"
              disabled={cuadreRealizado}
              step="100"
            />
          </label>
        </div>
        {cuadreRealizado && diferenciaTransferencia !== null && (
          <div className={`diferencia-resultado ${diferenciaTransferencia === 0 ? 'exacto' : diferenciaTransferencia > 0 ? 'sobrante' : 'faltante'}`}>
            {diferenciaTransferencia === 0 ? (
              <><FaCheckCircle /> <span>✅ Transferencias cuadran perfecto</span></>
            ) : diferenciaTransferencia > 0 ? (
              <><FaExclamationTriangle /> <span>Sobrante en transferencias: {formatCurrency(diferenciaTransferencia)}</span></>
            ) : (
              <><FaExclamationTriangle /> <span>Faltante en transferencias: {formatCurrency(Math.abs(diferenciaTransferencia))}</span></>
            )}
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div className="observaciones-section">
        <label>
          Observaciones:
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales..."
            rows="2"
          />
        </label>
      </div>

      {/* Acciones */}
      <div className="cash-register-actions">
        <button
          onClick={handleCalcularDiferencias}
          disabled={cuadreRealizado}
          className="btn-calcular"
        >
          Calcular diferencias
        </button>
        <button
          onClick={resetearCuadre}
          className="btn-reset"
        >
          🔄 Reiniciar
        </button>
        <button
          onClick={handleGuardarCuadre}
          disabled={!cuadreRealizado || guardando}
          className="btn-guardar"
        >
          {guardando ? 'Guardando...' : '💾 Guardar Cuadre'}
        </button>
      </div>

      <div className="cuadre-info">
        <p className="info-text">
          Nota: Al cerrar el cuadre, la caja se reinicia a cero en el sistema (visualmente).
          Los datos históricos se guardan en la base de datos.
        </p>
      </div>
    </div>
  );
}

export default CashRegister;
