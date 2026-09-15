import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice.js';
import './BaseDelDia.css';

function BaseDelDia({ usuario }) {
  const [baseData, setBaseData] = useState({
    base_inicial: 0,
    menudo_hoy: 0,
    base_total: 0
  });
  const [loading, setLoading] = useState(true);
  const [mostrarMenudo, setMostrarMenudo] = useState(false);
  const [montoMenudo, setMontoMenudo] = useState('');
  const [observacionesMenudo, setObservacionesMenudo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarBase();
  }, []);

  const cargarBase = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/base-del-dia`, {
        params: { cajero_id: usuario.id }
      });
      setBaseData(response.data);
    } catch (error) {
      console.error('Error cargando base del día:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarMenudo = async () => {
    const monto = parseFloat(montoMenudo);
    if (isNaN(monto) || monto <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    setGuardando(true);
    try {
      await axios.post(`${API_URL}/menudo`, {
        cajero_id: usuario.id,
        monto: monto,
        observaciones: observacionesMenudo || null
      });

      alert('✅ Menudo registrado y sumado a la base');
      setMontoMenudo('');
      setObservacionesMenudo('');
      setMostrarMenudo(false);
      cargarBase();
    } catch (error) {
      console.error('Error registrando menudo:', error);
      alert('❌ Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="base-del-dia-loading">Cargando base...</div>;
  }

  return (
    <div className="base-del-dia">
      <div className="base-info">
        <FaMoneyBillWave className="base-icon" />
        <div className="base-text">
          <span className="base-label">Base del día</span>
          <span className="base-value">{formatPrice(baseData.base_total)}</span>
          {baseData.menudo_hoy > 0 && (
            <span className="base-detalle">
              (Base: {formatPrice(baseData.base_inicial)} + Menudo: {formatPrice(baseData.menudo_hoy)})
            </span>
          )}
        </div>
      </div>

      <button
        className="btn-agregar-menudo"
        onClick={() => setMostrarMenudo(true)}
        title="Registrar menudo enviado por la dueña"
      >
        <FaPlus /> Menudo
      </button>

      {mostrarMenudo && (
        <div className="menudo-modal-overlay" onClick={() => setMostrarMenudo(false)}>
          <div className="menudo-modal" onClick={(e) => e.stopPropagation()}>
            <h3>💵 Registrar Menudo</h3>
            <p className="menudo-info">
              Ingresa el monto enviado por la dueña. Este valor se sumará automáticamente a la base del día.
            </p>
            <label>
              Monto:
              <input
                type="number"
                value={montoMenudo}
                onChange={(e) => setMontoMenudo(e.target.value)}
                placeholder="0"
                step="100"
                autoFocus
              />
            </label>
            <label>
              Observaciones (opcional):
              <input
                type="text"
                value={observacionesMenudo}
                onChange={(e) => setObservacionesMenudo(e.target.value)}
                placeholder="Ej: Enviado por la dueña"
              />
            </label>
            <div className="menudo-acciones">
              <button onClick={() => setMostrarMenudo(false)} className="btn-cancelar-menudo">
                Cancelar
              </button>
              <button
                onClick={handleAgregarMenudo}
                disabled={guardando || !montoMenudo}
                className="btn-guardar-menudo"
              >
                {guardando ? 'Guardando...' : 'Sumar a la base'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BaseDelDia;
