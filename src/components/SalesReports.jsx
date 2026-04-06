import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function SalesReports() {
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('ventas_diarias');
      if (error) throw error;
      setDailySales(data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('No se pudieron cargar las ventas');
      setDailySales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesByRange = async () => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('ventas_por_rango', { start_date: dateRange.start, end_date: dateRange.end });
      if (error) throw error;
      setDailySales(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al filtrar ventas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando reportes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="sales-reports">
      <h3>📊 Reportes de Ventas</h3>
      <div className="date-range">
        <label>
          Desde: 
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} 
          />
        </label>
        <label>
          Hasta: 
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} 
          />
        </label>
        <button onClick={fetchSalesByRange}>Filtrar</button>
        <button onClick={fetchDailySales}>Reset</button>
      </div>
      {dailySales.length === 0 ? (
        <p className="sin-datos">No hay ventas registradas</p>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_ventas" stroke="#9b2c2c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SalesReports;
