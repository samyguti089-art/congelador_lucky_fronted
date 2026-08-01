import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaCheckCircle } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import './ModalPago.css';

function ModalPago({ total, usuario, onConfirm, onCancel }) {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [cambio, setCambio] = useState(0);

  useEffect(() => {
    if (metodoPago === 'efectivo') {
      calcularCambio();
    }
  }, [montoRecibido, total]);

  const calcularCambio = () => {
    const monto = parseFloat(montoRecibido);
    if (!isNaN(monto) && monto >= total) {
      setCambio(monto - total);
    } else {
      setCambio(0);
    }
  };

  const handleConfirm = () => {
    let payload = { 
      metodo_pago: metodoPago, 
      cambio: 0, 
      monto_efectivo: 0, 
      monto_transferencia: 0 
    };

    if (metodoPago === 'efectivo') {
      const monto = parseFloat(montoRecibido);
      if (isNaN(monto) || monto < total) {
        alert(`El monto recibido (${formatPrice(monto)}) es menor al total (${formatPrice(total)})`);
        return;
      }
      payload.cambio = monto - total;
      payload.monto_efectivo = total;
      payload.monto_transferencia = 0;

    } else if (metodoPago === 'transferencia') {
      payload.monto_efectivo = 0;
      payload.monto_transferencia = total;

    } else if (metodoPago === 'compartida') {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const transferencia = parseFloat(montoTransferencia) || 0;
      
      if (efectivo < 0 || transferencia < 0) {
        alert('Ingresa montos válidos');
        return;
      }
      if (efectivo + transferencia < total) {
        alert(`La suma de efectivo (${formatPrice(efectivo)}) y transferencia (${formatPrice(transferencia)}) es menor al total (${formatPrice(total)})`);
        return;
      }
      // Si hay excedente, se asume cambio en efectivo
      const cambioCalculado = (efectivo + transferencia) - total;
      payload.cambio = cambioCalculado > 0 ? cambioCalculado : 0;
      payload.monto_efectivo = efectivo;
      payload.monto_transferencia = transferencia;
    }

    onConfirm(payload);
  };

  return (
    <div className="modal-pago-overlay">
      <div className="modal-pago-content">
        <h2>💳 Pago</h2>
        <p className="total-pago">Total: <strong>{formatPrice(total)}</strong></p>
        <p className="cajero-info">Cajero: {usuario.nombre}</p>

        <div className="metodos-pago">
          <button
            className={`metodo-btn ${metodoPago === 'efectivo' ? 'active' : ''}`}
            onClick={() => setMetodoPago('efectivo')}
          >
            <FaMoneyBillWave /> Efectivo
          </button>
          <button
            className={`metodo-btn ${metodoPago === 'transferencia' ? 'active' : ''}`}
            onClick={() => setMetodoPago('transferencia')}
          >
            <FaCreditCard /> Transferencia
          </button>
          <button
            className={`metodo-btn ${metodoPago === 'compartida' ? 'active' : ''}`}
            onClick={() => setMetodoPago('compartida')}
          >
            <FaExchangeAlt /> Compartida
          </button>
        </div>

        {metodoPago === 'efectivo' && (
          <div className="monto-recibido">
            <label>
              Monto recibido:
              <input
                type="number"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder="0"
                step="100"
                autoFocus
              />
            </label>
            {cambio > 0 && (
              <div className="cambio-calculo">
                <span>Cambio: <strong>{formatPrice(cambio)}</strong></span>
              </div>
            )}
            {parseFloat(montoRecibido) < total && montoRecibido !== '' && (
              <div className="monto-insuficiente">
                ⚠️ Faltan {formatPrice(total - parseFloat(montoRecibido))}
              </div>
            )}
          </div>
        )}

        {metodoPago === 'transferencia' && (
          <div className="transferencia-info">
            <p>✅ El pago se confirmará por transferencia</p>
            <p className="transferencia-detalle">Total a pagar: {formatPrice(total)}</p>
          </div>
        )}

        {metodoPago === 'compartida' && (
          <div className="compartida-info">
            <div className="compartida-inputs">
              <label>
                Monto en Efectivo:
                <input
                  type="number"
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  placeholder="0"
                  step="100"
                />
              </label>
              <label>
                Monto en Transferencia:
                <input
                  type="number"
                  value={montoTransferencia}
                  onChange={(e) => setMontoTransferencia(e.target.value)}
                  placeholder="0"
                  step="100"
                />
              </label>
            </div>
            <div className="compartida-resumen">
              <p>Total pagado: <strong>{formatPrice((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0))}</strong></p>
              <p>Total venta: <strong>{formatPrice(total)}</strong></p>
              {((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) - total) > 0 && (
                <p className="cambio-compartida">Cambio en efectivo: <strong>{formatPrice((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) - total)}</strong></p>
              )}
            </div>
          </div>
        )}

        <div className="modal-pago-buttons">
          <button className="btn-cancelar-pago" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-confirmar-pago" onClick={handleConfirm}>
            <FaCheckCircle /> Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalPago;
