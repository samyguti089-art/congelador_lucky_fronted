import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import './ModalPago.css';

function ModalPago({ total, onConfirm, onCancel, usuario }) {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [cambio, setCambio] = useState(0);

  useEffect(() => {
    calcularCambio();
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
    if (metodoPago === 'efectivo') {
      const monto = parseFloat(montoRecibido);
      if (isNaN(monto) || monto < total) {
        alert(`El monto recibido (${formatPrice(monto)}) es menor al total (${formatPrice(total)})`);
        return;
      }
    }
    onConfirm({
      metodo_pago: metodoPago,
      cambio: metodoPago === 'efectivo' ? cambio : 0,
      monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : total
    });
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
