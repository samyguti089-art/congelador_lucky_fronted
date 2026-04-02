import React, { useState } from "react";
import AdminUsuarios from "./AdminGestion_usr";
import AdminInventario from "./AdminInventario";
import AdminReportes from "./AdminReportes";
import AdminAlertas from "./AdminAlertas";
import AdminNotificaciones from "./AdminNotificaciones";
import "./Admin.css";

function AdminDashboard({
  usuario,
  usuarios,
  inventario,
  ventas,
  agregarUsuario,
  eliminarUsuario,
  agregarProducto,
  actualizarProducto,
  eliminarProducto,
  cerrarSesion
}) {
  const [moduloActivo, setModuloActivo] = useState("usuarios");

  const renderModulo = () => {
    switch (moduloActivo) {
      case "usuarios":
        return (
          <AdminUsuarios
            usuarios={usuarios}
            agregarUsuario={agregarUsuario}
            eliminarUsuario={eliminarUsuario}
          />
        );
      case "inventario":
        return (
          <AdminInventario
            inventario={inventario}
            agregarProducto={agregarProducto}
            actualizarProducto={actualizarProducto}
            eliminarProducto={eliminarProducto}
          />
        );
      case "reportes":
        return <AdminReportes ventas={ventas} />;
      case "alertas":
        return <AdminAlertas inventario={inventario} />;
      default:
        return <p>Selecciona un módulo en el menú.</p>;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2>⚙️ Panel Admin</h2>
        <ul>
          <li
            onClick={() => setModuloActivo("usuarios")}
            className={moduloActivo === "usuarios" ? "active" : ""}
          >
            👥 Usuarios
          </li>
          <li
            onClick={() => setModuloActivo("inventario")}
            className={moduloActivo === "inventario" ? "active" : ""}
          >
            📦 Inventario
          </li>
          <li
            onClick={() => setModuloActivo("reportes")}
            className={moduloActivo === "reportes" ? "active" : ""}
          >
            📊 Reportes
          </li>
          <li
            onClick={() => setModuloActivo("alertas")}
            className={moduloActivo === "alertas" ? "active" : ""}
          >
            ⚠️ Alertas
          </li>
        </ul>
      </aside>

      {/* Contenido principal */}
      <div className="admin-main">
        <header className="admin-header">
          <h1>Bienvenido, {usuario.nombre} 👑</h1>
          <button className="logout-btn" onClick={cerrarSesion}>
            🚪 Cerrar sesión
          </button>
        </header>

        {/* Notificaciones visuales */}
        <AdminNotificaciones inventario={inventario} />

        <main className="admin-content">{renderModulo()}</main>
      </div>
    </div>
  );
}

export default AdminDashboard;
