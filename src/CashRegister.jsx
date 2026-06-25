import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { FaMoneyBillWave, FaBoxes, FaCheckCircle, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import './CashRegister.css';

function CashRegister({ usuario, inventario, onClose }) {
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumenVentas, setResumenVentas] = useState({ total: 0, cantidad: 0 });
  const [efectivoContado, setEfectivoContado] = useState('');
  const [diferencia, setDiferencia] = useState(null);
  const [cuadreRealizado, setCuadreRealizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventarioFisico, setInventarioFisico] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [fecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarVentasDelDia();
  }, []);

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
      const { data: ventas, error } = await supabase
        .from('ventas_cabecera')
        .select('*')
        .gte('fecha', `${fecha} 00:00:00`)
        .lte('fecha', `${fecha} 23:59:59`)
        .eq('cajero_id', usuario.id);

      if (error) throw error;

      const total = ventas?.reduce((sum, v) => sum + v.total_venta, 0) || 0;
      setVentasDelDia(ventas || []);
      setResumenVentas({ total, cantidad: ventas?.length || 0 });
    } catch (error) {
      console.error('Error cargando ventas:', error);
      alert('Error al cargar las ventas del día');
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularDiferencia = () => {
    const contado = parseFloat(efectivoContado);
    if (isNaN(contado) || contado < 0) {
      alert('Ingresa un monto válido');
      return;
    }
    const diff = contado - resumenVentas.total;
    setDiferencia(diff);
    setCuadreRealizado(true);
  };

  const handleConteoInventario = (productoId, cantidadContada) => {
    setInventarioFisico(prev => ({
      ...prev,
      [productoId]: parseInt(cantidadContada) || 0
    }));
  };

  const handleGuardarCuadre = async () => {
    if (!cuadreRealizado) {
      alert('Primero debes calcular la diferencia');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('cuadres_caja')
        .insert({
          fecha: fecha,
          cajero_id: usuario.id,
          total_ventas_sistema: resumenVentas.total,
          efectivo_contado: parseFloat(efectivoContado),
          diferencia: diferencia,
          estado: 'cerrado',
          inventario_conteo: inventarioFisico,
          observaciones: observaciones
        });

      if (error) throw error;

      alert('✅ Cuadre de caja guardado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error guardando cuadre:', error);
      alert('Error al guardar el cuadre: ' + error.message);
    } finally {
      setGuardando(false);
    }
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
        <div className="resumen-item">
          <span className="label">Total Ventas</span>
          <span className="value">{formatCurrency(resumenVentas.total)}</span>
        </div>
        <div className="resumen-item">
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
            />
          </label>
          <button
            onClick={handleCalcularDiferencia}
            disabled={cuadreRealizado || !efectivoContado}
            className="btn-calcular"
          >
            Calcular
          </button>
        </div>

        {cuadreRealizado && diferencia !== null && (
          <div className={`diferencia-resultado ${diferencia === 0 ? 'exacto' : diferencia > 0 ? 'sobrante' : 'faltante'}`}>
            {diferencia === 0 ? (
              <>
                <FaCheckCircle /> <span>✅ Cuadre perfecto</span>
              </>
            ) : diferencia > 0 ? (
              <>
                <FaExclamationTriangle /> <span>Sobrante: {formatCurrency(diferencia)}</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle /> <span>Faltante: {formatCurrency(Math.abs(diferencia))}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Conteo de Inventario */}
      <div className="inventario-section">
        <h3>📦 Conteo de Inventario</h3>
        <p className="instruccion">Ingresa la cantidad física de cada producto</p>
        <div className="conteo-grid">
          {inventario.map((producto) => (
            <div key={producto.id} className="conteo-item">
              <span className="producto-nombre">{producto.subcategoria || producto.nombre}</span>
              <span className="producto-sistema">Sistema: {producto.cantidad}</span>
              <input
                type="number"
                placeholder="Contado"
                value={inventarioFisico[producto.id] || ''}
                onChange={(e) => handleConteoInventario(producto.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div className="observaciones-section">
        <label>
          Observaciones:
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales sobre el cuadre..."
            rows="2"
          />
        </label>
      </div>

      {/* Acciones */}
      <div className="cash-register-actions">
        <button
          onClick={handleGuardarCuadre}
          disabled={!cuadreRealizado || guardando}
          className="btn-guardar"
        >
          <FaSave /> {guardando ? 'Guardando...' : 'Guardar Cuadre'}
        </button>
      </div>
    </div>
  );
}

export default CashRegister;
