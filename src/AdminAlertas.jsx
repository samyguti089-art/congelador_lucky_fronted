import React from "react";

function AdminAlertas({ inventario }) {
  const umbral = 10; // stock mínimo
  const productosCriticos = inventario.filter(item => item.cantidad <= umbral);

  return (
    <div className="admin-alertas">
      <h2>⚠️ Alertas de Stock</h2>
      {productosCriticos.length === 0 ? (
        <p>Todo el inventario está en buen estado.</p>
      ) : (
        <ul>
          {productosCriticos.map(item => (
            <li key={item.id}>
              {item.nombre} - Stock: {item.cantidad}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminAlertas;
