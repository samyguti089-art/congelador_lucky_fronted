import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { FaMoneyBillWave, FaCreditCard, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatPrice } from './utils/formatPrice.js';
import './CashRegister.css';

function CashRegister({ usuario, inventario, onClose }) {
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumenVentas, setResumenVentas] = useState({
    total: 0,
    efectivo: 0,
    transferencia: 0,
    cantidad: 0
  });
  const [base, setBase] = useState('');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [transferenciaContada, setTransferenciaContada] = useState('');
  const [diferenciaEfectivo, setDiferenciaEfectivo] = useState(null);
  const [diferenciaTransferencia, setDiferenciaTransferencia] = useState(null);
  const [cuadreRealizado, setCuadreRealizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cuadreYaRealizado, setCuadreYaRealizado] = useState(false);

  const [fechaColombia] = useState(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  });

  const [rangoUTC] = useState(() => {
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const [year, month, day] = fechaStr.split('-').map(Number);
    const inicio = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
    const fin = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59));
    return {
      inicio: inicio.toISOString(),
      fin: fin.toISOString()
    };
  });

  useEffect(() => {
    cargarVentasDelDia();
  }, []);

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
      const { data: cuadreExistente, error: errorCuadre } = await supabase
        .from('cuadres_caja')
        .select('id')
        .eq('cajero_id', usuario.id)
        .eq('fecha', fechaColombia)
        .maybeSingle();

      if (errorCuadre) throw errorCuadre;

      if (cuadreExistente) {
        setCuadreYaRealizado(true);
        setResumenVentas({ total: 0, efectivo: 0, transferencia: 0, cantidad: 0 });
        setVentasDelDia([]);
        setLoading(false);
        return;
      }

      const { data: ventas, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .eq('cajero_id', usuario.id)
        .gte('fecha', rangoUTC.inicio)
        .lte('fecha', rangoUTC.fin);

      if (error) throw error;

      if (ventas && ventas.length > 0) {
        const totalEfectivo = ventas.reduce((sum, v) => {
          if (v.metodo_pago === 'efectivo') return sum + v.total_venta;
          if (v.metodo_pago === 'compartida') return sum + (v.monto_efectivo || 0);
          return sum;
        }, 0);

        const totalTransferencia = ventas.reduce((sum, v) => {
          if (v.metodo_pago === 'transferencia') return sum + v.total_venta;
          if (v.metodo_pago === 'compartida') return sum + (v.monto_transferencia || 0);
          return sum;
        }, 0);

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
    // ✅ Validar base
    const baseNum = parseFloat(base);
    if (isNaN(baseNum) || baseNum < 0) {
      alert('⚠️ La base del día es obligatoria. Ingresa un monto válido (mayor o igual a 0).');
      return;
    }

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

    // ✅ Validar base nuevamente por seguridad
    const baseNum = parseFloat(base);
    if (isNaN(baseNum) || baseNum < 0) {
      alert('⚠️ La base del día es obligatoria. No se puede guardar el cuadre sin ella.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        fecha: fechaColombia,
        cajero_id: usuario.id,
        base: baseNum,
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

      setCuadreYaRealizado(true);
      setResumenVentas({ total: 0, efectivo: 0, transferencia: 0, cantidad: 0 });
      setVentasDelDia([]);
      setBase('');
      setEfectivoContado('');
      setTransferenciaContada('');
      setDiferenciaEfectivo(null);
      setDiferenciaTransferencia(null);
      setCuadreRealizado(false);
      setObservaciones('');

      alert('✅ Cuadre de caja guardado exitosamente. La base quedó registrada para el próximo día.');

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error guardando cuadre:', error);
      alert('❌ Error al guardar el cuadre: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGuardando(false);
    }
  };

  const resetearCuadre = () => {
    setBase('');
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

  if (cuadreYaRealizado) {
    return (
      <div className="cash-register-container">
        <div className="cash-register-header">
          <h2>💰 Cuadre de Caja</h2>
          <span className="fecha-badge">📅 {fechaColombia}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="cuadre-realizado">
          <div className="icono-grande">✅</div>
          <h3>Cuadre ya realizado</h3>
          <p>El cuadre de caja para hoy ya fue guardado.</p>
          <p className="info-text">La base quedó registrada para el próximo día.</p>
          <button onClick={onClose} className="btn-cerrar-cuadre">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cash-register-container">
      <div className="cash-register-header">
        <h2>💰 Cuadre de Caja</h2>
        <span className="fecha-badge">📅 {fechaColombia}</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

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

      {/* ✅ NUEVO: Base del día (obligatoria) */}
      <div className="cuadre-section base-section">
        <h3>🏦 Base para el próximo día (OBLIGATORIA)</h3>
        <div className="cuadre-input-group">
          <label>
            Monto que queda en caja para mañana:
            <input
              type="number"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="0"
              disabled={cuadreRealizado}
              step="100"
              required
            />
          </label>
        </div>
        <p className="info-text">
          💡 Este monto es el efectivo que la cajera deja para trabajar el día siguiente. No se puede modificar una vez guardado.
        </p>
      </div>

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
          disabled={!cuadreRealizado || guardando || !base}
          className="btn-guardar"
        >
          {guardando ? 'Guardando...' : '💾 Guardar Cuadre'}
        </button>
      </div>

      <div className="cuadre-info">
        <p className="info-text">
          ⚠️ La base es obligatoria para cerrar el cuadre. Una vez guardada, no podrá modificarse.
        </p>
      </div>
    </div>
  );
}

export default CashRegister;
