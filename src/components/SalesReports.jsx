import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function SalesReports() {
  const [dailySales, setDailySales] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    const { data, error } = await supabase.rpc('ventas_diarias');
    if (error) console.error(error);
    else setDailySales(data);
  };

  const fetchSalesByRange = async () => {
    if (!dateRange.start || !dateRange.end) return;
    const { data, error } = await supabase
      .rpc('ventas_por_rango', { start_date: dateRange.start, end_date: dateRange.end });
    if (error) console.error(error);
    else setDailySales(data);
  };

  return (
    <div className="sales-reports">
      <h3>📊 Reportes de Ventas</h3>
      <div className="date-range">
        <label>Desde: <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} /></label>
        <label>Hasta: <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} /></label>
        <button onClick={fetchSalesByRange}>Filtrar</button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_ventas" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesReports;
