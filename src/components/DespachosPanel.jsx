import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { formatPrice } from '../utils/formatPrice';
import './OwnerDashboard.css';

const MESES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const getFechaColombia = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
};

function DespachosPanel({ inventario = [], usuario, actualizarInventario }) {
  const hoyColombia = getFechaColombia();
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(hoyColombia);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estado para la Relación Mensual de Despachos
  const [mesSeleccionado, setMesSeleccionado] = useState(hoyColombia.slice(0, 7));
  const [despachosMes, setDespachosMes] = useState([]);
  const [loadingMes, setLoadingMes] = useState(true);
  const [mostrarMesCompleto, setMostrarMesCompleto] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Mapa rápido de productos para obtener nombre y precio unitario
  const mapaProductos = useMemo(() => {
    const mapa = {};
    (inventario || []).forEach((p) => {
      mapa[p.id] = {
        nombre: p.subcategoria || p.nombre || `Producto #${p.id}`,
        precio: Number(p.precio) || 0,
        stock: Number(p.cantidad) || 0
      };
    });
    return mapa;
  }, [inventario]);

  useEffect(() => {
    cargarDespachosDia();
    // Si el usuario cambia a una fecha de otro mes, sincronizamos el mes seleccionado
    if (fecha && fecha.slice(0, 7) !== mesSeleccionado) {
      setMesSeleccionado(fecha.slice(0, 7));
    }
  }, [fecha]);

  useEffect(() => {
    cargarDespachosMes();
  }, [mesSeleccionado]);

  const cargarDespachosDia = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/despachos`, {
        params: { fecha }
      });
      setDespachos(response.data || []);
    } catch (error) {
      console.error('Error cargando despachos del día:', error);
      if (supabase) {
        const { data } = await supabase
          .from('despachos')
          .select('*')
          .eq('fecha', fecha)
          .order('id', { ascending: true });
        setDespachos(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarDespachosMes = async () => {
    if (!mesSeleccionado) return;
    setLoadingMes(true);
    try {
      const [anioStr, mesStr] = mesSeleccionado.split('-');
      const anio = parseInt(anioStr, 10);
      const mes = parseInt(mesStr, 10);
      const ultimoDia = new Date(anio, mes, 0).getDate();
      const inicioMes = `${mesSeleccionado}-01`;
      const finMes = `${mesSeleccionado}-${String(ultimoDia).padStart(2, '0')}`;

      let registros = null;

      if (supabase) {
        const { data, error } = await supabase
          .from('despachos')
          .select('*')
          .gte('fecha', inicioMes)
          .lte('fecha', finMes)
          .order('fecha', { ascending: true });
        if (!error && Array.isArray(data)) {
          registros = data;
        }
      }

      if (registros === null) {
        const response = await axios.get(`${API_URL}/despachos`, {
          params: { fecha_inicio: inicioMes, fecha_fin: finMes }
        });
        registros = (response.data || []).filter(
          (d) => d.fecha >= inicioMes && d.fecha <= finMes
        );
      }

      setDespachosMes(registros);
    } catch (error) {
      console.error('Error cargando relación mensual de despachos:', error);
      setDespachosMes([]);
    } finally {
      setLoadingMes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;

    const cantNum = parseInt(cantidad, 10);
    if (!productoId || !cantNum || cantNum <= 0) {
      alert('Selecciona un producto y una cantidad válida');
      return;
    }

    setGuardando(true);
    try {
      await axios.post(`${API_URL}/despacho`, {
        producto_id: parseInt(productoId, 10),
        cantidad: cantNum,
        fecha: fecha,
        observaciones: observaciones ? observaciones.trim() : null,
        usuario_id: usuario?.id || 1
      });

      alert('✅ Despacho registrado correctamente');
      setProductoId('');
      setCantidad('');
      setObservaciones('');

      await Promise.all([cargarDespachosDia(), cargarDespachosMes()]);

      if (actualizarInventario) {
        actualizarInventario(false);
      }
    } catch (error) {
      console.error('Error registrando despacho:', error);
      alert('❌ Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGuardando(false);
    }
  };

  const getInfoProducto = (id) => {
    return mapaProductos[id] || {
      nombre: `Producto #${id}`,
      precio: 0,
      stock: 0
    };
  };

  const formatearHoraColombia = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Cálculos de vista previa del formulario
  const prodSeleccionadoInfo = productoId ? getInfoProducto(parseInt(productoId, 10)) : null;
  const cantPreview = parseInt(cantidad, 10) > 0 ? parseInt(cantidad, 10) : 0;
  const valorPreview = prodSeleccionadoInfo ? prodSeleccionadoInfo.precio * cantPreview : 0;

  // Cálculos de Despachos Diarios
  const filasDiarias = useMemo(() => {
    return despachos.map((d) => {
      const info = getInfoProducto(d.producto_id);
      const cant = Number(d.cantidad) || 0;
      const precio = info.precio;
      const valorTotal = precio * cant;
      return {
        ...d,
        nombreProducto: info.nombre,
        precio,
        cantidadNum: cant,
        valorTotal
      };
    });
  }, [despachos, mapaProductos]);

  const totalCantidadDia = filasDiarias.reduce((acc, item) => acc + item.cantidadNum, 0);
  const totalValorDia = filasDiarias.reduce((acc, item) => acc + item.valorTotal, 0);

  // Cálculos de Relación Mensual de Despachos
  const nombreMesTitulo = useMemo(() => {
    if (!mesSeleccionado) return '';
    const [anioStr, mesStr] = mesSeleccionado.split('-');
    const idx = parseInt(mesStr, 10) - 1;
    return `${MESES_ES[idx] || ''} ${anioStr}`;
  }, [mesSeleccionado]);

  const filasMensuales = useMemo(() => {
    if (!mesSeleccionado) return [];
    const [anioStr, mesStr] = mesSeleccionado.split('-');
    const anio = parseInt(anioStr, 10);
    const mes = parseInt(mesStr, 10);
    const ultimoDia = new Date(anio, mes, 0).getDate();

    const agrupadoPorFecha = {};
    despachosMes.forEach((d) => {
      const f = d.fecha;
      if (!f) return;
      const info = getInfoProducto(d.producto_id);
      const cant = Number(d.cantidad) || 0;
      const valor = info.precio * cant;

      if (!agrupadoPorFecha[f]) {
        agrupadoPorFecha[f] = { fecha: f, cantidad: 0, valor: 0, registros: 0 };
      }
      agrupadoPorFecha[f].cantidad += cant;
      agrupadoPorFecha[f].valor += valor;
      agrupadoPorFecha[f].registros += 1;
    });

    if (mostrarMesCompleto) {
      const todasLasFechas = [];
      for (let dia = 1; dia <= ultimoDia; dia++) {
        const fechaDia = `${mesSeleccionado}-${String(dia).padStart(2, '0')}`;
        todasLasFechas.push(
          agrupadoPorFecha[fechaDia] || {
            fecha: fechaDia,
            cantidad: 0,
            valor: 0,
            registros: 0
          }
        );
      }
      return todasLasFechas;
    }

    return Object.values(agrupadoPorFecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [despachosMes, mapaProductos, mesSeleccionado, mostrarMesCompleto]);

  const totalCantidadMes = filasMensuales.reduce((acc, f) => acc + f.cantidad, 0);
  const totalValorMes = filasMensuales.reduce((acc, f) => acc + f.valor, 0);

  return (
    <div className="despachos-panel despachos-esquema-wrapper">
      {/* FORMULARIO DE REGISTRO DE DESPACHO */}
      <div className="despacho-registro-card">
        <div className="despacho-registro-header">
          <div>
            <h3>📦 Registrar Nuevo Despacho</h3>
            <p className="despacho-registro-sub">
              Selecciona el producto y la cantidad recibida para cargarla al inventario y valorizar el despacho.
            </p>
          </div>
          <div className="despacho-fecha-top">
            <label>
              <span>Fecha de despacho:</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>
            {fecha !== hoyColombia && (
              <button
                type="button"
                className="btn-ir-hoy-despacho"
                onClick={() => setFecha(hoyColombia)}
              >
                Hoy
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="despacho-form">
          <div className="form-row">
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
            >
              <option value="">Seleccionar producto...</option>
              {inventario.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.subcategoria || p.nombre} — {formatPrice(p.precio)} (Stock: {p.cantidad})
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cantidad (paq.)"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              min="1"
              required
            />

            <button
              type="submit"
              className="btn-registrar-despacho"
              disabled={guardando}
              style={{
                opacity: guardando ? 0.65 : 1,
                cursor: guardando ? 'not-allowed' : 'pointer'
              }}
            >
              {guardando ? '⏳ Registrando...' : '📦 Registrar Despacho'}
            </button>
          </div>

          {prodSeleccionadoInfo && (
            <div className="despacho-preview-bar">
              <span>
                Producto: <strong>{prodSeleccionadoInfo.nombre}</strong>
              </span>
              <span>
                Precio Unitario: <strong>{formatPrice(prodSeleccionadoInfo.precio)}</strong>
              </span>
              <span>
                Cantidad: <strong>{cantPreview || 0} paq.</strong>
              </span>
              <span className="despacho-preview-total">
                Valor Despacho: <strong>{formatPrice(valorPreview)}</strong>
              </span>
            </div>
          )}

          <input
            type="text"
            placeholder="Observaciones (opcional, ej: remisión turno mañana)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="observaciones-input"
          />
        </form>
      </div>

      {/* GRILLA DE ESQUEMA: DESPACHOS DIARIOS + RELACIÓN MENSUAL */}
      <div className="despachos-esquema-grid">
        {/* TABLA 1: DESPACHOS DIARIOS */}
        <div className="despachos-sheet-card">
          <div className="despachos-sheet-banner">
            <div className="despachos-sheet-title-group">
              <h4>DESPACHOS DIARIOS</h4>
              <span className="despachos-sheet-date-pill">📅 {fecha}</span>
            </div>
            <div className="despachos-sheet-kpis">
              <span className="sheet-kpi-pill">{totalCantidadDia} paq.</span>
              <span className="sheet-kpi-pill valor">{formatPrice(totalValorDia)}</span>
            </div>
          </div>

          {loading ? (
            <p className="loading-text">Cargando despachos del día...</p>
          ) : filasDiarias.length === 0 ? (
            <div className="sin-datos-sheet">
              <p>No hay despachos registrados para la fecha <strong>{fecha}</strong>.</p>
            </div>
          ) : (
            <div className="tabla-container">
              <table className="despachos-excel-table">
                <thead>
                  <tr>
                    <th>NOMBRE DEL PRODUCTO</th>
                    <th className="num-col">PRECIO</th>
                    <th className="center-col">CANTIDAD</th>
                    <th className="num-col">VALOR TOTAL</th>
                    <th className="center-col">REGISTRADO</th>
                  </tr>
                </thead>
                <tbody>
                  {filasDiarias.map((d) => {
                    const hora = formatearHoraColombia(d.fecha_cierre || d.created_at);
                    return (
                      <tr key={d.id}>
                        <td className="prod-col">
                          <div className="prod-nombre-principal">{d.nombreProducto}</div>
                          {d.observaciones && (
                            <div className="prod-obs-nota">📝 {d.observaciones}</div>
                          )}
                        </td>
                        <td className="num-col">{formatPrice(d.precio)}</td>
                        <td className="center-col cant-badge-col">{d.cantidadNum}</td>
                        <td className="num-col valor-strong-col">{formatPrice(d.valorTotal)}</td>
                        <td className="center-col fecha-reg-col">
                          <span>{d.fecha || fecha}</span>
                          {hora && <small className="hora-reg-sub">{hora}</small>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="excel-total-row">
                    <td>TOTAL DESPACHO</td>
                    <td className="num-col">—</td>
                    <td className="center-col">{totalCantidadDia}</td>
                    <td className="num-col total-destacado">{formatPrice(totalValorDia)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* TABLA 2: RELACIÓN DE DESPACHOS DEL MES */}
        <div className="despachos-sheet-card mensual-card">
          <div className="despachos-sheet-banner banner-mensual">
            <div className="despachos-sheet-title-group">
              <h4>RELACIÓN DE DESPACHOS MES DE {nombreMesTitulo}</h4>
            </div>
            <div className="despachos-mes-controles">
              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="mes-picker-input"
              />
              <button
                type="button"
                className={`btn-toggle-dias-mes ${mostrarMesCompleto ? 'activo' : ''}`}
                onClick={() => setMostrarMesCompleto(!mostrarMesCompleto)}
                title="Alternar entre ver solo días con despachos o todos los días del calendario"
              >
                {mostrarMesCompleto ? '📅 Mes completo' : '📌 Días activos'}
              </button>
            </div>
          </div>

          {loadingMes ? (
            <p className="loading-text">Cargando relación mensual...</p>
          ) : filasMensuales.length === 0 ? (
            <div className="sin-datos-sheet">
              <p>No hay despachos registrados en {nombreMesTitulo.toLowerCase()}.</p>
              <button
                type="button"
                className="btn-ver-calendario-vacio"
                onClick={() => setMostrarMesCompleto(true)}
              >
                Ver tabla del mes completo
              </button>
            </div>
          ) : (
            <div className="tabla-container tabla-mensual-scroll">
              <table className="despachos-excel-table tabla-relacion-mes">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th className="center-col">PAQ.</th>
                    <th className="num-col">VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {filasMensuales.map((item) => {
                    const esFechaActiva = item.fecha === fecha;
                    const sinMovimiento = item.cantidad === 0;
                    return (
                      <tr
                        key={item.fecha}
                        className={`${esFechaActiva ? 'fila-dia-seleccionado' : ''} ${sinMovimiento ? 'fila-sin-movimiento' : 'fila-clicable'}`}
                        onClick={() => setFecha(item.fecha)}
                        title="Clic para ver el detalle de despachos de este día"
                      >
                        <td className="fecha-mes-col">
                          <span>{item.fecha}</span>
                          {esFechaActiva && <span className="tag-viendo">Viendo</span>}
                        </td>
                        <td className="center-col">{item.cantidad}</td>
                        <td className={`num-col ${item.valor > 0 ? 'valor-strong-col' : ''}`}>
                          {formatPrice(item.valor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="excel-total-row">
                    <td>TOTAL DESPACHOS</td>
                    <td className="center-col">{totalCantidadMes}</td>
                    <td className="num-col total-destacado">{formatPrice(totalValorMes)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DespachosPanel;
