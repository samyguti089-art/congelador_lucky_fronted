import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { FaClipboardCheck, FaSave, FaSync } from 'react-icons/fa';
import './AnalisisInventario.css';

function AnalisisInventario({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [conteoFisico, setConteoFisico] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [semanaActual, setSemanaActual] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarInventarioYConteo();
  }, []);

  const cargarInventarioYConteo = async () => {
    setLoading(true);
    try {
      // 1. Obtener inventario del sistema
      const response = await axios.get(`${API_URL}/inventario`);
      const inventario = response.data || [];

      // 2. Calcular lunes de la semana actual
      const hoy = new Date();
      const dia = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
      const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1); // lunes
      const lunes = new Date(hoy.setDate(diff));
      const semanaStr = lunes.toISOString().split('T')[0];
      setSemanaActual(semanaStr);

      // 3. Buscar si ya hay un conteo registrado esta semana
      const { data: snapshots } = await supabase
        .from('inventario_snapshots')
        .select('*')
        .eq('semana', semanaStr);

      // 4. Merge: si existe snapshot con conteo, precargar
      const productosConEstado = inventario.map(prod => {
        const snap = (snapshots || []).find(s => s.producto_id === prod.id);
        return {
          ...prod,
          cantidad_fisica: snap?.cantidad_fisica ?? '',
          observaciones_prev: snap?.observaciones ?? ''
        };
      });

      setProductos(productosConEstado);
      
      // Precargar valores ingresados
      const conteoInicial = {};
      productosConEstado.forEach(p => {
        if (p.cantidad_fisica !== '' && p.cantidad_fisica !== null) {
          conteoInicial[p.id] = p.cantidad_fisica;
        }
      });
      setConteoFisico(conteoInicial);

    } catch (err) {
      console.error('Error cargando inventario:', err);
      alert('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleConteoChange = (productoId, valor) => {
    setConteoFisico(prev => ({
      ...prev,
      [productoId]: valor
    }));
  };

  const handleGuardarConteo = async () => {
    // Validar que al menos un producto tenga conteo
    const conConteo = Object.keys(conteoFisico).filter(id => conteoFisico[id] !== '');
    if (conConteo.length === 0) {
      alert('Debes ingresar al menos un conteo físico');
      return;
    }

    if (!window.confirm(`¿Guardar conteo de ${conConteo.length} productos?`)) return;

    setGuardando(true);
    try {
      // 1. Crear snapshot si no existe
      await supabase.rpc('crear_snapshot_semanal');

      // 2. Guardar conteo físico
      const updates = productos
        .filter(p => conteoFisico[p.id] !== '' && conteoFisico[p.id] !== undefined)
        .map(p => {
          const fisico = parseFloat(conteoFisico[p.id]) || 0;
          return {
            semana: semanaActual,
            producto_id: p.id,
            subcategoria: p.subcategoria,
            nombre: p.nombre,
            categoria: p.categoria,
            cantidad_sistema: p.cantidad,
            cantidad_fisica: fisico,
            diferencia: fisico - p.cantidad,
            observaciones: observaciones || null,
            usuario_id: usuario.id,
            fecha_conteo: new Date().toISOString()
          };
        });

      const { error } = await supabase
        .from('inventario_snapshots')
        .upsert(updates, { onConflict: 'semana,producto_id' });

      if (error) throw error;

      alert('✅ Conteo guardado correctamente');
      cargarInventarioYConteo();
    } catch (err) {
      console.error('Error guardando conteo:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const exportarCSV = () => {
    const filas = productos
      .filter(p => conteoFisico[p.id] !== '' && conteoFisico[p.id] !== undefined)
      .map(p => {
        const fisico = parseFloat(conteoFisico[p.id]) || 0;
        const diff = fisico - p.cantidad;
        return [
          p.subcategoria || p.nombre,
          p.cantidad,
          fisico,
          diff,
          diff === 0 ? 'OK' : diff > 0 ? 'Sobrante' : 'Faltante'
        ].join(',');
      });
    const csv = ['Producto,Sistema,Fisico,Diferencia,Estado', ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${semanaActual}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="analisis-inventario"><p>Cargando inventario...</p></div>;
  }

  const totalProductos = productos.length;
  const conConteo = Object.keys(conteoFisico).filter(id => conteoFisico[id] !== '').length;

  return (
    <div className="analisis-inventario">
      <div className="analisis-header">
        <h3>📊 Análisis Semanal de Inventario</h3>
        <div className="semana-badge">
          Semana del {semanaActual}
        </div>
      </div>

      <div className="analisis-resumen">
        <span>Productos: <strong>{totalProductos}</strong></span>
        <span>Contados: <strong>{conConteo}</strong></span>
        <span>Pendientes: <strong>{totalProductos - conConteo}</strong></span>
      </div>

      <div className="analisis-acciones">
        <button onClick={cargarInventarioYConteo} className="btn-refresh">
          <FaSync /> Recargar
        </button>
        <button onClick={exportarCSV} className="btn-exportar">
          📥 Exportar CSV
        </button>
        <button 
          onClick={handleGuardarConteo} 
          disabled={guardando}
          className="btn-guardar-conteo"
        >
          <FaSave /> {guardando ? 'Guardando...' : 'Guardar Conteo'}
        </button>
      </div>

      <div className="analisis-tabla-container">
        <table className="analisis-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Sistema</th>
              <th>Físico</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => {
              const fisico = conteoFisico[p.id];
              const fisicoNum = fisico === '' || fisico === undefined ? null : parseFloat(fisico);
              const diff = fisicoNum !== null ? fisicoNum - p.cantidad : null;
              
              return (
                <tr key={p.id} className={
                  diff === null ? '' :
                  diff === 0 ? 'fila-ok' :
                  diff > 0 ? 'fila-sobrante' : 'fila-faltante'
                }>
                  <td>{p.subcategoria || p.nombre}</td>
                  <td>{p.cantidad}</td>
                  <td>
                    <input
                      type="number"
                      value={fisico || ''}
                      onChange={(e) => handleConteoChange(p.id, e.target.value)}
                      placeholder="—"
                      min="0"
                    />
                  </td>
                  <td>{diff !== null ? (diff > 0 ? '+' : '') + diff : '—'}</td>
                  <td>
                    {diff === null && '—'}
                    {diff === 0 && '✅ OK'}
                    {diff > 0 && `🟡 +${diff}`}
                    {diff < 0 && `🔴 ${diff}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="analisis-observaciones">
        <label>
          Observaciones generales del conteo:
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Faltaron 2 empanadas por venta no registrada, ajustado..."
            rows="3"
          />
        </label>
      </div>
    </div>
  );
}

export default AnalisisInventario;
