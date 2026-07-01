import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '../utils/formatPrice';
import './OwnerDashboard.css';

// Importar logo (ajusta la ruta según tu estructura)
import logoImg from '../components/images/logo.jpeg'; // o desde public: "/images/logo.png"

function VentasAcumuladas() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rangoSeleccionado, setRangoSeleccionado] = useState('30dias');

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    setFechaFin(fin.toISOString().split('T')[0]);
    setFechaInicio(inicio.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ventas/acumuladas`, {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      });
      setDatos(response.data);
    } catch (error) {
      console.error('Error cargando ventas acumuladas:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cambiarRango = (dias) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    setFechaFin(fin.toISOString().split('T')[0]);
    setFechaInicio(inicio.toISOString().split('T')[0]);
    setRangoSeleccionado(`${dias}dias`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ============================================================
  // EXPORTAR A EXCEL
  // ============================================================
  const exportToExcel = () => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel
    const excelData = datos.map(row => ({
      'Fecha': formatearFecha(row.fecha),
      'Ventas del día': row.total_dia === 0 ? 'Sin ventas' : `$${Number(row.total_dia).toLocaleString('es-CO')}`,
      'Total acumulado': `$${Number(row.acumulado).toLocaleString('es-CO')}`
    }));

    // Agregar fila de totales
    const totalGeneral = datos.reduce((sum, row) => sum + row.total_dia, 0);
    const ultimoAcumulado = datos.length > 0 ? datos[datos.length - 1].acumulado : 0;
    excelData.push({
      'Fecha': 'TOTAL GENERAL',
      'Ventas del día': `$${Number(totalGeneral).toLocaleString('es-CO')}`,
      'Total acumulado': `$${Number(ultimoAcumulado).toLocaleString('es-CO')}`
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas Acumuladas');
    XLSX.writeFile(wb, `Reporte_Ventas_Acumuladas_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  // ============================================================
  // EXPORTAR A PDF (CON BRANDING)
  // ============================================================
  const exportToPDF = () => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ---------- ENCABEZADO CON LOGO ----------
    const logoWidth = 40;
    const logoHeight = 20;
    const marginX = 14;
    const marginY = 14;

    // Logo (asegúrate de que la ruta sea correcta)
    try {
      doc.addImage(logoImg, 'PNG', marginX, marginY, logoWidth, logoHeight);
    } catch (e) {
      // Si no carga el logo, solo texto
      console.warn('Logo no cargado, usando solo texto');
    }

    // Título y subtítulo
    doc.setFontSize(18);
    doc.setTextColor('#5c3a21');
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Ventas Acumuladas', pageWidth - marginX, marginY + 8, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor('#8b5e3c');
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`, pageWidth - marginX, marginY + 16, { align: 'right' });

    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - marginX, marginY + 24, { align: 'right' });

    // Línea separadora
    doc.setDrawColor('#e6d5c3');
    doc.line(marginX, marginY + 32, pageWidth - marginX, marginY + 32);

    // ---------- TABLA ----------
    const tableData = datos.map(row => [
      formatearFecha(row.fecha),
      row.total_dia === 0 ? 'Sin ventas' : `$${Number(row.total_dia).toLocaleString('es-CO')}`,
      `$${Number(row.acumulado).toLocaleString('es-CO')}`
    ]);

    // Totales
    const totalGeneral = datos.reduce((sum, row) => sum + row.total_dia, 0);
    const ultimoAcumulado = datos.length > 0 ? datos[datos.length - 1].acumulado : 0;
    tableData.push([
      { content: 'TOTAL GENERAL', styles: { fontStyle: 'bold', fillColor: '#faf7f2' } },
      { content: `$${Number(totalGeneral).toLocaleString('es-CO')}`, styles: { fontStyle: 'bold', fillColor: '#faf7f2' } },
      { content: `$${Number(ultimoAcumulado).toLocaleString('es-CO')}`, styles: { fontStyle: 'bold', fillColor: '#faf7f2' } }
    ]);

    autoTable(doc, {
      startY: marginY + 38,
      head: [['Fecha', 'Ventas del día', 'Total acumulado']],
      body: tableData,
      headStyles: {
        fillColor: '#9b2c2c',
        textColor: '#ffffff',
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 'auto' },
        2: { halign: 'right', cellWidth: 'auto' }
      },
      alternateRowStyles: { fillColor: '#faf7f2' },
      styles: {
        fontSize: 9,
        textColor: '#3b2a1f',
        lineColor: '#e6d5c3',
        lineWidth: 0.1
      },
      margin: { left: marginX, right: marginX },
    });

    // ---------- PIE DE PÁGINA ----------
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor('#8b5e3c');
    doc.text('© Congelados Lucky - Todos los derechos reservados', pageWidth / 2, finalY, { align: 'center' });

    // ---------- GUARDAR PDF ----------
    doc.save(`Reporte_Ventas_Acumuladas_${fechaInicio}_a_${fechaFin}.pdf`);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return <div className="loading-state">Cargando ventas acumuladas...</div>;
  }

  return (
    <div className="ventas-acumuladas">
      <div className="ventas-acumuladas-header">
        <h3>📈 Ventas Acumuladas</h3>
        <div className="export-buttons">
          <button onClick={exportToExcel} className="btn-export-excel">
            📊 Excel
          </button>
          <button onClick={exportToPDF} className="btn-export-pdf">
            📄 PDF
          </button>
        </div>
      </div>

      <div className="rango-buttons">
        <button 
          className={rangoSeleccionado === '7dias' ? 'active' : ''} 
          onClick={() => cambiarRango(7)}
        >
          Última semana
        </button>
        <button 
          className={rangoSeleccionado === '15dias' ? 'active' : ''} 
          onClick={() => cambiarRango(15)}
        >
          15 días
        </button>
        <button 
          className={rangoSeleccionado === '30dias' ? 'active' : ''} 
          onClick={() => cambiarRango(30)}
        >
          30 días
        </button>
        <button 
          className={rangoSeleccionado === '90dias' ? 'active' : ''} 
          onClick={() => cambiarRango(90)}
        >
          90 días
        </button>
      </div>

      <div className="tabla-container">
        <table className="ventas-acumuladas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ventas del día</th>
              <th>Total acumulado</th>
            </tr>
          </thead>
          <tbody>
            {datos.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No hay datos en este rango</td>
              </tr>
            ) : (
              datos.map((row, index) => (
                <tr key={index} className={row.total_dia === 0 ? 'dia-sin-ventas' : ''}>
                  <td>{formatearFecha(row.fecha)}</td>
                  <td>
                    {row.total_dia === 0 ? (
                      <span className="sin-ventas-msg">No se registraron ventas en este día</span>
                    ) : (
                      formatPrice(row.total_dia)
                    )}
                  </td>
                  <td className="acumulado-cell">{formatPrice(row.acumulado)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="total-footer-acumulado">
              <td><strong>Total general</strong></td>
              <td>
                <strong>
                  {formatPrice(datos.reduce((sum, row) => sum + row.total_dia, 0))}
                </strong>
              </td>
              <td>
                <strong>
                  {datos.length > 0 ? formatPrice(datos[datos.length - 1].acumulado) : '$0'}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default VentasAcumuladas;
