import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaCheckCircle, FaCoins, FaTimes } from 'react-icons/fa';
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

  // Botones de billetes rápidos
  const setBilletesExacto = () => {
    setMontoRecibido(total.toString());
  };

  const setBilleteFijo = (valor) => {
    setMontoRecibido(valor.toString());
  };

  const sumarBillete = (valor) => {
    const actual = parseFloat(montoRecibido) || 0;
    setMontoRecibido((actual + valor).toString());
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
        alert(`El monto recibido (${formatPrice(monto || 0)}) es menor al total (${formatPrice(total)})`);
        return;
      }
      payload.cambio = monto - total;
      payload.monto_efectivo = total;
      payload.monto_transferencia = 0;

    } else if (metodoPago === 'transferencia') {
      payload.cambio = 0;
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
      const cambioCalculado = (efectivo + transferencia) - total;
      payload.cambio = cambioCalculado > 0 ? cambioCalculado : 0;
      payload.monto_efectivo = efectivo;
      payload.monto_transferencia = transferencia;
    }

    onConfirm(payload);
  };

  return (
    <div className="modal-pago-overlay" onClick={onCancel}>
      <div className="modal-pago-content" onClick={(e) => e.stopPropagation()}>
        {/* ENCABEZADO */}
        <div className="modal-pago-header">
          <div className="modal-pago-titulo-box">
            <span className="pago-icono-badge">💳</span>
            <div>
              <h3>Finalizar Cobro</h3>
              <p className="cajero-tag">Atendido por: <strong>{usuario?.nombre || 'Caja'}</strong></p>
            </div>
          </div>
          <button className="btn-cerrar-modal-pago" onClick={onCancel} title="Cerrar">
            <FaTimes />
          </button>
        </div>

        {/* TOTAL GIGANTE DESTACADO */}
        <div className="total-pago-banner">
          <span className="total-label">TOTAL A PAGAR</span>
          <span className="total-monto">{formatPrice(total)}</span>
        </div>

        {/* SELECTOR DE MÉTODOS DE PAGO ESTILO TARJETAS */}
        <div className="metodos-pago-cards">
          <div
            className={`metodo-card ${metodoPago === 'efectivo' ? 'activa' : ''}`}
            onClick={() => setMetodoPago('efectivo')}
          >
            <div className="metodo-card-icon efectivo-icon">
              <FaMoneyBillWave />
            </div>
            <div className="metodo-card-info">
              <strong>Efectivo</strong>
              <span>Pago en caja</span>
            </div>
            <div className="radio-circle"></div>
          </div>

          <div
            className={`metodo-card ${metodoPago === 'transferencia' ? 'activa' : ''}`}
            onClick={() => setMetodoPago('transferencia')}
          >
            <div className="metodo-card-icon transferencia-icon">
              <FaCreditCard />
            </div>
            <div className="metodo-card-info">
              <strong>Transferencia</strong>
              <span>Nequi / Bancolombia</span>
            </div>
            <div className="radio-circle"></div>
          </div>

          <div
            className={`metodo-card ${metodoPago === 'compartida' ? 'activa' : ''}`}
            onClick={() => setMetodoPago('compartida')}
          >
            <div className="metodo-card-icon mixta-icon">
              <FaExchangeAlt />
            </div>
            <div className="metodo-card-info">
              <strong>Mixto</strong>
              <span>Efectivo + Transfer</span>
            </div>
            <div className="radio-circle"></div>
          </div>
        </div>

        {/* PANEL EFECTIVO: BILLETES RÁPIDOS Y CAMBIO */}
        {metodoPago === 'efectivo' && (
          <div className="panel-efectivo">
            {/* BILLETES RÁPIDOS */}
            <div className="billetes-rapidos-section">
              <span className="seccion-subtitulo">⚡ Billetes Rápidos:</span>
              <div className="billetes-grid">
                <button 
                  type="button"
                  className="btn-billete btn-exacto"
                  onClick={setBilletesExacto}
                >
                  <FaCoins /> Exacto
                </button>
                <button 
                  type="button"
                  className="btn-billete"
                  onClick={() => setBilleteFijo(10000)}
                >
                  $10.000
                </button>
                <button 
                  type="button"
                  className="btn-billete"
                  onClick={() => setBilleteFijo(20000)}
                >
                  $20.000
                </button>
                <button 
                  type="button"
                  className="btn-billete"
                  onClick={() => setBilleteFijo(50000)}
                >
                  $50.000
                </button>
                <button 
                  type="button"
                  className="btn-billete"
                  onClick={() => setBilleteFijo(100000)}
                >
                  $100.000
                </button>
              </div>

              {/* INCREMENTALES */}
              <div className="incrementales-grid">
                <button 
                  type="button"
                  className="btn-incremental"
                  onClick={() => sumarBillete(2000)}
                >
                  + $2.000
                </button>
                <button 
                  type="button"
                  className="btn-incremental"
                  onClick={() => sumarBillete(5000)}
                >
                  + $5.000
                </button>
                <button 
                  type="button"
                  className="btn-incremental"
                  onClick={() => sumarBillete(10000)}
                >
                  + $10.000
                </button>
                <button 
                  type="button"
                  className="btn-incremental"
                  onClick={() => sumarBillete(20000)}
                >
                  + $20.000
                </button>
              </div>
            </div>

            {/* INPUT DE MONTO RECIBIDO */}
            <div className="monto-recibido-box">
              <label>¿Cuánto entrega el cliente?</label>
              <div className="input-monto-wrapper">
                <span className="signo-peso">$</span>
                <input
                  type="number"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder="0"
                  step="100"
                  autoFocus
                />
                {montoRecibido && (
                  <button 
                    type="button"
                    className="btn-limpiar-input"
                    onClick={() => setMontoRecibido('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* CAMBIO GIGANTE */}
            {cambio > 0 && (
              <div className="cambio-box-exito animate-pop">
                <div className="cambio-label">CAMBIO A ENTREGAR</div>
                <div className="cambio-valor">{formatPrice(cambio)}</div>
              </div>
            )}

            {/* AVISO DE MONTO INSUFICIENTE */}
            {parseFloat(montoRecibido) < total && montoRecibido !== '' && (
              <div className="alerta-faltante">
                ⚠️ Faltan {formatPrice(total - parseFloat(montoRecibido))} para cubrir la venta
              </div>
            )}
          </div>
        )}

        {/* PANEL TRANSFERENCIA */}
        {metodoPago === 'transferencia' && (
          <div className="transferencia-card-box">
            <div className="transferencia-icon-lg">📲</div>
            <h4>Pago Electrónico</h4>
            <p>Verifica el comprobante por <strong>Nequi, Daviplata o Bancolombia</strong> antes de confirmar.</p>
            <div className="transferencia-monto-pill">
              Total transferido: <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        )}

        {/* PANEL COMPARTIDO / MIXTO */}
        {metodoPago === 'compartida' && (
          <div className="compartida-panel">
            <div className="compartida-inputs-grid">
              <div className="compartida-field">
                <label>💵 Monto en Efectivo:</label>
                <input
                  type="number"
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  placeholder="0"
                  step="100"
                />
              </div>
              <div className="compartida-field">
                <label>📱 Monto Transferencia:</label>
                <input
                  type="number"
                  value={montoTransferencia}
                  onChange={(e) => setMontoTransferencia(e.target.value)}
                  placeholder="0"
                  step="100"
                />
              </div>
            </div>

            <div className="compartida-resumen-box">
              <div className="resumen-row">
                <span>Total pagado:</span>
                <strong>{formatPrice((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0))}</strong>
              </div>
              <div className="resumen-row">
                <span>Total venta:</span>
                <span>{formatPrice(total)}</span>
              </div>
              {((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) - total) > 0 && (
                <div className="resumen-row cambio-destacado">
                  <span>Cambio en efectivo:</span>
                  <strong>{formatPrice((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) - total)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="modal-pago-actions">
          <button type="button" className="btn-cancelar-accion" onClick={onCancel}>
            Volver al Carrito
          </button>
          <button 
            type="button" 
            className="btn-confirmar-accion" 
            onClick={handleConfirm}
            disabled={
              (metodoPago === 'efectivo' && (parseFloat(montoRecibido) < total || !montoRecibido)) ||
              (metodoPago === 'compartida' && ((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) < total))
            }
          >
            <FaCheckCircle /> Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalPago;
