import React, { useEffect, useState } from "react";

function AdminNotificaciones({ inventario }) {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const umbral = 10; // stock mínimo
    const productosCriticos = inventario.filter(item => item.cantidad <= umbral);

    if (productosCriticos.length > 0) {
      const nuevas = productosCriticos.map(item => ({
        tipo: "alerta",
        mensaje: `⚠️ Stock bajo: ${item.nombre} (${item.cantidad} unidades)`
      }));
      setNotificaciones(nuevas);
    } else {
      setNotificaciones([]);
    }
  }, [inventario]);

  return (
    <div className="admin-notificaciones">
      {notificaciones.map((n, index) => (
        <div key={index} className={`notificacion ${n.tipo}`}>
          {n.mensaje}
        </div>
      ))}
    </div>
  );
}

export default AdminNotificaciones;
