// 1. Cambia la columna `hora-cell` para usar fecha_cierre
// 2. Agrega columna "Estado" con badge

// En el <thead>:
<thead>
  <tr>
    <th>Producto</th>
    <th>Cantidad</th>
    <th>Observaciones</th>
    <th>Estado</th>
    <th>Registrado</th>
  </tr>
</thead>

// En el <tbody>:
{despachos.map((d) => (
  <tr key={d.id}>
    <td>{getProductoNombre(d.producto_id)}</td>
    <td className="cantidad-cell">{d.cantidad}</td>
    <td>{d.observaciones || '-'}</td>
    <td>
      <span className={`estado-badge ${d.estado || 'cerrado'}`}>
        {d.estado === 'cerrado' ? '✅ Cerrado' : '⏳ Abierto'}
      </span>
    </td>
    <td className="hora-cell">
      {d.fecha_cierre 
        ? new Date(d.fecha_cierre).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
        : d.fecha}
    </td>
  </tr>
))}
