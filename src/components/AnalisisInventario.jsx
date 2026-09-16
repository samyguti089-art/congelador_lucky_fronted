import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { FaSync, FaSave } from 'react-icons/fa';
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

  // ============================================================
  //  CARGAR INVENTARIO Y CONTEO PREVIO
  // ============================================================
  const cargarInventarioYConteo = async () => {
    setLoading(true);
    try {
      // 1. Obtener inventario del sistema
      const response = await axios.get(`${API_URL}/inventario`);
      const inventario = response.data || [];

      // 2. Calcular lunes de la semana actual
      const hoy = new Date();
      const dia = hoy.getDay(); // 0 = domingo, 1 = lunes...
      const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
      const lunes = new Date(hoy.setDate(diff));
      const semanaStr = lunes.toISOString().split('T')[0];
      setSemanaActual(semanaStr);

      // 3. Buscar si ya hay conteo registrado esta semana
      const { data: snapshots } = await supabase
        .from('inventario_snapshots')
        .select('*')
        .eq('semana', semanaStr);

      // 4. Merge con inventario actual
      const productosConEstado = inventario.map(prod => {
        const snap = (snapshots || []).find(s => s.producto_id === prod.id);
        return {
          ...prod,
          cantidad_fisica: snap?.cantidad_fisica ?? '',
          observaciones_prev: snap?.observaciones ?? ''
        };
      });

      setProductos(productosConEstado);

      // Precargar valores ya ingresados
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

  // ============================================================
  //  MANEJO DE CAMBIOS EN EL CONTEO
  // ============================================================
  const handleConteoChange = (productoId, valor) => {
    setConteoFisico(prev => ({
      ...prev,
      [productoId]: valor
    }));
  };

  // ============================================================
  //  GUARDAR CONTEO EN SUPABASE
  // ============================================================
  const handleGuardarConteo = async () => {
    const conConteo = Object.keys(conteoFisico).filter(
      id => conteoFisico[id] !== '' && conteoFisico[id] !== undefined
    );

    if (conConteo.length === 0) {
      alert('Debes ingresar al menos un conteo físico');
      return;
    }

    if (!window.confirm(`¿Guardar conteo de ${conConteo.length} productos?`)) return;

    setGuardando(true);
    try {
      // 1. Asegurar que existe el snapshot de la semana
      await supabase.rpc('crear_snapshot_semanal');

      // 2. Preparar updates
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

  // ============================================================
  //  EXPORTAR A EXCEL
  // ============================================================
  const exportarExcel = () => {
    const productosConConteo = productos.filter(
      p => conteoFisico[p.id] !== '' && conteoFisico[p.id] !== undefined
    );

    if (productosConConteo.length === 0) {
      alert('Debes ingresar al menos un conteo para exportar');
      return;
    }

    // Preparar datos
    const datos = productosConConteo.map(p => {
      const fisico = parseFloat(conteoFisico[p.id]) || 0;
      const diff = fisico - p.cantidad;
      let estado = 'OK';
      if (diff > 0) estado = 'Sobrante';
      if (diff < 0) estado = 'Faltante';

      return {
        'Categoría': p.categoria || '',
        'Producto': p.subcategoria || p.nombre || '',
        'Stock Sistema': p.cantidad,
        'Conteo Físico': fisico,
        'Diferencia': diff,
        'Estado': estado,
        'Precio Unitario': p.precio || 0,
        'Valor Diferencia': diff * (p.precio || 0)
      };
    });

    // Totales
    const totalSistema = datos.reduce((s, d) => s + d['Stock Sistema'], 0);
    const totalFisico = datos.reduce((s, d) => s + d['Conteo Físico'], 0);
    const totalDiferencia = datos.reduce((s, d) => s + d['Diferencia'], 0);
    const totalValor = datos.reduce((s, d) => s + d['Valor Diferencia'], 0);

    // Fecha formateada para el archivo
    const fechaArchivo = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');

    // Crear hoja
    const ws = XLSX.utils.json_to_sheet(datos);

    // Agregar fila de totales al final
    const filaTotales = [
      'TOTALES', '', totalSistema, totalFisico, totalDiferencia, '', '', totalValor
    ];
    XLSX.utils.sheet_add_aoa(ws, [filaTotales], { origin: -1 });

    // Anchos de columna
    ws['!cols'] = [
      { wch: 14 },  // Categoría
      { wch: 32 },  // Producto
      { wch: 15 },  // Stock Sistema
      { wch: 15 },  // Conteo Físico
      { wch: 12 },  // Diferencia
      { wch: 12 },  // Estado
      { wch: 16 },  // Precio Unitario
      { wch: 18 }   // Valor Diferencia
    ];

    // Agregar metadatos al inicio
    XLSX.utils.sheet_add_aoa(ws, [
      [`Análisis de Inventario - Semana del ${semanaActual}`],
      [`Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`],
      [`Usuario: ${usuario?.nombre || ''}`],
      [`Total productos contados: ${datos.length}`],
      [],
    ], { origin: 'A1' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Guardar archivo
    XLSX.writeFile(wb, `Analisis-Inventario-${fechaArchivo}.xlsx`);
  };

  // ============================================================
  //  RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="analisis-inventario">
        <p>Cargando inventario...</p>
      </div>
    );
  }

  const totalProductos = productos.length;
  const conConteo = Object.keys(conteoFisico).filter(
    id => conteoFisico[id] !== '' && conteoFisico[id] !== undefined
  ).length;

  return (
    <div className="analisis-inventario">
      <div className="analisis-header">
        <h3>📊 Análisis Semanal de Inventario</h3>
        <div className="semana-badge">Semana del {semanaActual}</div>
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
        <button onClick={exportarExcel} className="btn-exportar">
          📥 Exportar Excel
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
              const fisicoNum = (fisico === '' || fisico === undefined) ? null : parseFloat(fisico);
              const diff = fisicoNum !== null ? fisicoNum - p.cantidad : null;

              return (
                <tr
                  key={p.id}
                  className={
                    diff === null ? '' :
                    diff === 0 ? 'fila-ok' :
                    diff > 0 ? 'fila-sobrante' : 'fila-faltante'
                  }
                >
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
