import React, { useState } from "react";

function AdminInventario({ inventario, agregarProducto, actualizarProducto, eliminarProducto }) {
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: 0,
    cantidad: 0
  });

  return (
    <div className="admin-inventario">
      <h2>📦 Gestión de Inventario</h2>

      {/* Tabla de productos */}
      <table className="inventario-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inventario.map((item) => (
            <tr key={item.id}>
              <td>{item.nombre}</td>
              <td>
                <input
                  type="number"
                  value={item.cantidad}
                  onChange={(e) =>
                    actualizarProducto(item.id, { cantidad: parseInt(e.target.value) })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.precio}
                  onChange={(e) =>
                    actualizarProducto(item.id, { precio: parseInt(e.target.value) })
                  }
                />
              </td>
              <td>
                <button onClick={() => eliminarProducto(item.id)}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario para agregar producto */}
      <h3>➕ Agregar nuevo producto</h3>
      <input
        type="text"
        placeholder="Nombre"
        value={nuevoProducto.nombre}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
      />
      <input
        type="number"
        placeholder="Precio"
        value={nuevoProducto.precio}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: parseInt(e.target.value) })}
      />
      <input
        type="number"
        placeholder="Cantidad"
        value={nuevoProducto.cantidad}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: parseInt(e.target.value) })}
      />
      <button
        onClick={() => {
          agregarProducto(nuevoProducto);
          setNuevoProducto({ nombre: "", precio: 0, cantidad: 0 });
        }}
      >
        Guardar producto
      </button>
    </div>
  );
}

export default AdminInventario;
