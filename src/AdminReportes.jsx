import React from "react";

function AdminReportes({ ventas }) {
  // Agrupar ventas por producto
  const agruparVentas = (ventasFiltradas) => {
    const conteo = {};
    ventasFiltradas.forEach(v => {
      if (!conteo[v.nombre]) {
        conteo[v.nombre] = { unidades: 0, total: 0 };
      }
      conteo[v.nombre].unidades += v.cantidad;
      conteo[v.nombre].total += v.total;
    });
    return conteo;
  };

  // Fecha actual
  const hoy = new Date().toISOString().split("T")[0];
  const mesActual = new Date().getMonth();

  // Ventas del día
  const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
  const conteoHoy = agruparVentas(ventasHoy);
  const productoMasVendidoHoy = Object.entries(conteoHoy)
    .sort((a, b) => b[1].unidades - a[1].unidades)[0];

  // Ventas del mes
  const ventasMes = ventas.filter(v => new Date(v.fecha).getMonth() === mesActual);
  const conteoMes = agruparVentas(ventasMes);
  const top5Mes = Object.entries(conteoMes)
    .sort((a, b) => b[1].unidades - a[1].unidades)
    .slice(0, 5);

  return (
    <div className="admin-reportes">
      <h2>📊 Reportes de Ventas</h2>

      {/* Reporte diario */}
      <div className="reporte-diario">
        <h3>Producto más vendido hoy</h3>
        {productoMasVendidoHoy ? (
          <p>
            {productoMasVendidoHoy[0]} - Unidades: {productoMasVendidoHoy[1].unidades} - 💰 ${productoMasVendidoHoy[1].total}
          </p>
        ) : (
          <p>No hay ventas registradas hoy.</p>
        )}
      </div>

      {/* Reporte mensual */}
      <div className="reporte-mensual">
        <h3>Top 5 productos más vendidos del mes</h3>
        {top5Mes.length > 0 ? (
          <ol>
            {top5Mes.map(([nombre, datos], index) => (
              <li key={index}>
                {nombre} - Unidades: {datos.unidades} - 💰 ${datos.total}
              </li>
            ))}
          </ol>
        ) : (
          <p>No hay ventas registradas este mes.</p>
        )}
      </div>
    </div>
  );
}

export default AdminReportes;
