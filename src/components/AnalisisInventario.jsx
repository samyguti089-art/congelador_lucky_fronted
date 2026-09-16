import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';
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
      const response = await axios.get(`${API_URL}/inventario`);
      const inventario = response.data || [];

      const hoy = new Date();
      const dia = hoy.getDay();
      const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
      const lunes = new Date(hoy.setDate(diff));
      const semanaStr = lunes.toISOString().split('T')[0];
      setSemanaActual(semanaStr);

      const { data: snapshots } = await supabase
        .from('inventario_snapshots')
        .select('*')
        .eq('semana', semanaStr);

      const productosConEstado = inventario.map(prod => {
        const snap = (snapshots || []).find(s => s.producto_id === prod.id);
        return {
          ...prod,
          cantidad_fisica: snap?.cantidad_fisica ?? '',
          observaciones_prev: snap?.observaciones ?? ''
        };
      });

      setProductos(productosConEstado);

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

  // ============================================================
  //  GUARDAR CONTEO
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
      await supabase.rpc('crear_snapshot_semanal');

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
  //  EXPORTAR A EXCEL CON COLORES
  // ============================================================
  const exportarExcel = () => {
    const productosConConteo = productos.filter(
      p => conteoFisico[p.id] !== '' && conteoFisico[p.id] !== undefined
    );

    if (productosConConteo.length === 0) {
      alert('Debes ingresar al menos un conteo para exportar');
      return;
    }

    // ===== PALETA DE COLORES =====
    const colorHeader = {
      fill: { fgColor: { rgb: '5C3A21' } },       // Marrón
      font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
        left: { style: 'thin', color: { rgb: 'FFFFFF' } },
        right: { style: 'thin', color: { rgb: 'FFFFFF' } }
      }
    };

    const colorTitulo = {
      font: { bold: true, sz: 14, color: { rgb: '5C3A21' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };

    const colorOK = {
      fill: { fgColor: { rgb: 'D4EDDA' } },       // Verde claro
      font: { color: { rgb: '155724' } },
      border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } }
    };

    const colorSobrante = {
      fill: { fgColor: { rgb: 'FFF3CD' } },       // Amarillo claro
      font: { color: { rgb: '856404' } },
      border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } }
    };

    const colorFaltante = {
      fill: { fgColor: { rgb: 'F8D7DA' } },       // Rojo claro
      font: { color: { rgb: '721C24' } },
      border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } }
    };

    const colorNeutro = {
      fill: { fgColor: { rgb: 'FFFFFF' } },
      font: { color: { rgb: '333333' } },
      border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } }
    };

    const colorTotal = {
      fill: { fgColor: { rgb: '5C3A21' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
      alignment: { horizontal: 'right' },
      border: { top: { style: 'medium', color: { rgb: '3B2A1F' } }, bottom: { style: 'medium', color: { rgb: '3B2A1F' } }, left: { style: 'thin', color: { rgb: '3B2A1F' } }, right: { style: 'thin', color: { rgb: '3B2A1F' } } }
    };

    // ===== DATOS =====
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

    const totalSistema = datos.reduce((s, d) => s + d['Stock Sistema'], 0);
    const totalFisico = datos.reduce((s, d) => s + d['Conteo Físico'], 0);
    const totalDiferencia = datos.reduce((s, d) => s + d['Diferencia'], 0);
    const totalValor = datos.reduce((s, d) => s + d['Valor Diferencia'], 0);

    // ===== CONSTRUIR HOJA CON ESTILOS =====
    const wb = XLSX.utils.book_new();
    const ws = {};

    // Encabezados
    const encabezados = ['Categoría', 'Producto', 'Stock Sistema', 'Conteo Físico', 'Diferencia', 'Estado', 'Precio Unitario', 'Valor Diferencia'];

    // Fila 1: Título
    ws['A1'] = { v: `Análisis de Inventario - Semana del ${semanaActual}`, s: colorTitulo };
    // Fila 2: Info
    ws['A2'] = { v: `Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`, s: colorNeutro };
    ws['A3'] = { v: `Usuario: ${usuario?.nombre || ''}`, s: colorNeutro };
    ws['A4'] = { v: `Total productos contados: ${datos.length}`, s: colorNeutro };

    // Fila 6: Encabezados de tabla
    encabezados.forEach((h, i) => {
      const col = String.fromCharCode(65 + i); // A, B, C, D, E, F, G, H
      ws[`${col}6`] = { v: h, s: colorHeader };
    });

    // Filas de datos a partir de la fila 7
    datos.forEach((d, idx) => {
      const fila = idx + 7;
      const diff = d['Diferencia'];
      let estiloFila = colorNeutro;
      if (diff === 0) estiloFila = colorOK;
      else if (diff > 0) estiloFila = colorSobrante;
      else estiloFila = colorFaltante;

      const valores = [
        d['Categoría'],
        d['Producto'],
        d['Stock Sistema'],
        d['Conteo Físico'],
        d['Diferencia'],
        d['Estado'],
        d['Precio Unitario'],
        d['Valor Diferencia']
      ];

      valores.forEach((v, i) => {
        const col = String.fromCharCode(65 + i);
        ws[`${col}${fila}`] = { v, s: estiloFila };
      });
    });

    // Fila de totales
    const filaTotal = datos.length + 7;
    ws[`A${filaTotal}`] = { v: 'TOTALES', s: colorTotal };
    ws[`B${filaTotal}`] = { v: '', s: colorTotal };
    ws[`C${filaTotal}`] = { v: totalSistema, s: colorTotal };
    ws[`D${filaTotal}`] = { v: totalFisico, s: colorTotal };
    ws[`E${filaTotal}`] = { v: totalDiferencia, s: colorTotal };
    ws[`F${filaTotal}`] = { v: '', s: colorTotal };
    ws[`G${filaTotal}`] = { v: '', s: colorTotal };
    ws[`H${filaTotal}`] = { v: totalValor, s: colorTotal };

    // Rango de la hoja
    ws['!ref'] = `A1:H${filaTotal}`;

    // Anchos de columnas
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

    // Altura de filas (encabezado)
    ws['!rows'] = [{ hpt: 20 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Nombre del archivo
    const fechaArchivo = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');

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
