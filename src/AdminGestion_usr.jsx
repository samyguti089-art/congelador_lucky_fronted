import React, { useState } from "react";

function AdminUsuarios({ usuarios, agregarUsuario, eliminarUsuario }) {
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    rol: "cajero"
  });

  return (
    <div className="admin-usuarios">
      <h2>👥 Gestión de Usuarios</h2>

      {/* Lista de usuarios */}
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id}>
              <td>{user.nombre}</td>
              <td>{user.correo}</td>
              <td>{user.rol}</td>
              <td>
                <button onClick={() => eliminarUsuario(user.id)}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario para agregar usuario */}
      <h3>➕ Crear nuevo usuario</h3>
      <input
        type="text"
        placeholder="Nombre"
        value={nuevoUsuario.nombre}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
      />
      <input
        type="email"
        placeholder="Correo"
        value={nuevoUsuario.correo}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={nuevoUsuario.contraseña}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })}
      />
      <select
        value={nuevoUsuario.rol}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
      >
        <option value="cajero">Cajero</option>
        <option value="administrador">Administrador</option>
      </select>
      <button
        onClick={() => {
          agregarUsuario(nuevoUsuario);
          setNuevoUsuario({ nombre: "", correo: "", contraseña: "", rol: "cajero" });
        }}
      >
        Crear usuario
      </button>
    </div>
  );
}

export default AdminUsuarios;
