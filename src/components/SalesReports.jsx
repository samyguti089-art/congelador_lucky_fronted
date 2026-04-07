import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import './OwnerDashboard.css';

function SalesReports() {
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState('area'); // area, bar, line

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

  // Colores personalizados
  const colors = {
    primary: '#9b2c2c',
    secondary: '#c2410c',
    tertiary: '#5c3a21',
    gradientStart: '#9b2c2c',
    gradientEnd: '#c2410c',
    areaFill: 'url(#colorGradient)'
  };

  // Formatear para tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            💰 {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="loading">Cargando reportes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const totalVentas = dailySales.reduce((sum, sale) => sum + sale.total_ventas, 0);
  const promedioVentas = dailySales.length > 0 ? totalVentas / dailySales.length : 0;

  return (
    <div className="sales-reports">
      <div className="reports-header">
        <h3>📊 Reportes de Ventas</h3>
        <div className="reports-stats">
          <div className="stat-badge">
            <span>Total período</span>
            <strong>{formatCurrency(totalVentas)}</strong>
          </div>
          <div className="stat-badge">
            <span>Promedio diario</span>
            <strong>{formatCurrency(promedioVentas)}</strong>
          </div>
        </div>
      </div>

      <div className="date-range">
        <div className="date-inputs">
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
        </div>
        <div className="filter-buttons">
          <button onClick={fetchSalesByRange} className="filter-btn">Filtrar</button>
          <button onClick={fetchDailySales} className="reset-btn">Reset</button>
        </div>
      </div>

      {/* Selector de tipo de gráfico */}
      <div className="chart-type-selector">
        <button 
          className={chartType === 'area' ? 'active' : ''} 
          onClick={() => setChartType('area')}
        >
          📈 Área
        </button>
        <button 
          className={chartType === 'bar' ? 'active' : ''} 
          onClick={() => setChartType('bar')}
        >
          📊 Barras
        </button>
        <button 
          className={chartType === 'line' ? 'active' : ''} 
          onClick={() => setChartType('line')}
        >
          📉 Línea
        </button>
      </div>

      {dailySales.length === 0 ? (
        <p className="sin-datos">No hay ventas registradas</p>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'area' && (
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.tertiary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickLine={{ stroke: '#e6d5c3' }}
                />
                <YAxis 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#5c3a21' }}
                  formatter={() => 'Ventas ($)'}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_ventas" 
                  stroke={colors.primary} 
                  strokeWidth={3}
                  fill={colors.areaFill}
                  name="Ventas"
                />
              </AreaChart>
            )}
            
            {chartType === 'bar' && (
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickLine={{ stroke: '#e6d5c3' }}
                />
                <YAxis 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#5c3a21' }}
                  formatter={() => 'Ventas ($)'}
                />
                <Bar 
                  dataKey="total_ventas" 
                  fill={colors.primary}
                  radius={[8, 8, 0, 0]}
                  name="Ventas"
                >
                  {dailySales.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? colors.primary : colors.secondary}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
            
            {chartType === 'line' && (
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d5c3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickLine={{ stroke: '#e6d5c3' }}
                />
                <YAxis 
                  tick={{ fill: '#5c3a21', fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#5c3a21' }}
                  formatter={() => 'Ventas ($)'}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_ventas" 
                  stroke={colors.primary} 
                  strokeWidth={3}
                  dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: colors.secondary }}
                  name="Ventas"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SalesReports;
