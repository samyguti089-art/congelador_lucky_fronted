import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { formatPrice } from '../utils/formatPrice.js';
import './OwnerDashboard.css';

function InventoryPanel() {
  const [inventory, setInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nombre: '', 
    subcategoria: '', 
    precio: '', 
    cantidad: '',
    stock_fabrica: '' 
  });
  const [newProduct, setNewProduct] = useState({ 
    nombre: '', 
    subcategoria: '', 
    precio: '', 
    cantidad: '',
    stock_fabrica: '',
    categoria: '' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('categoria', { ascending: true })
        .order('subcategoria', { ascending: true });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      alert('Error al cargar inventario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto) => {
    setEditingId(producto.id);
    setEditForm({
      nombre: producto.nombre || '',
      subcategoria: producto.subcategoria || '',
      precio: producto.precio,
      cantidad: producto.cantidad,
      stock_fabrica: producto.stock_fabrica || 0
    });
  };

  const handleUpdate = async (id) => {
    const { error } = await supabase
      .from('inventario')
      .update({
        nombre: editForm.nombre,
        subcategoria: editForm.subcategoria,
        precio: editForm.precio,
        cantidad: editForm.cantidad,
        stock_fabrica: editForm.stock_fabrica || 0
      })
      .eq('id', id);
    if (error) {
      console.error(error);
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      fetchInventory();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      const { error } = await supabase.from('inventario').delete().eq('id', id);
      if (error) {
        console.error(error);
        alert('Error al eliminar: ' + error.message);
      } else {
        fetchInventory();
      }
    }
  };

  const handleAdd = async () => {
    if (!newProduct.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    const { error } = await supabase.from('inventario').insert([{
      nombre: newProduct.nombre,
      subcategoria: newProduct.subcategoria,
      precio: newProduct.precio,
      cantidad: newProduct.cantidad || 0,
      stock_fabrica: newProduct.stock_fabrica || 0,
      categoria: newProduct.categoria || 'Otros'
    }]);
    if (error) {
      console.error(error);
      alert('Error al agregar: ' + error.message);
    } else {
      setNewProduct({ 
        nombre: '', 
        subcategoria: '', 
        precio: '', 
        cantidad: '',
        stock_fabrica: '',
        categoria: '' 
      });
      fetchInventory();
    }
  };

  // ===== AGRUPAR PRODUCTOS POR CATEGORÍA =====
  const groupedInventory = inventory.reduce((acc, producto) => {
    const cat = producto.categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(producto);
    return acc;
  }, {});

  const categoriasOrdenadas = Object.keys(groupedInventory).sort();

  if (loading) {
    return <div className="loading-state">Cargando inventario...</div>;
  }

  return (
    <div className="inventory-panel">
      <h3>📦 Gestión de Inventario</h3>

      {/* Formulario para agregar producto */}
      <div className="add-product">
        <input
          type="text"
          placeholder="Nombre"
          value={newProduct.nombre}
          onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
        />
        <input
          type="text"
          placeholder="Subcategoría / Descripción"
          value={newProduct.subcategoria}
          onChange={(e) => setNewProduct({ ...newProduct, subcategoria: e.target.value })}
        />
        <input
          type="text"
          placeholder="Categoría"
          value={newProduct.categoria}
          onChange={(e) => setNewProduct({ ...newProduct, categoria: e.target.value })}
        />
        <input
          type="number"
          placeholder="Precio"
          value={newProduct.precio}
          onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
        />
        <input
          type="number"
          placeholder="Unidades Tienda"
          value={newProduct.cantidad}
          onChange={(e) => setNewProduct({ ...newProduct, cantidad: e.target.value })}
        />
        <input
          type="number"
          placeholder="Unidades Fábrica"
          value={newProduct.stock_fabrica}
          onChange={(e) => setNewProduct({ ...newProduct, stock_fabrica: e.target.value })}
        />
        <button onClick={handleAdd}>Agregar Producto</button>
      </div>

      {/* Listado de productos agrupados por categoría */}
      {categoriasOrdenadas.length === 0 ? (
        <p className="sin-datos">No hay productos registrados</p>
      ) : (
        categoriasOrdenadas.map((categoria) => (
          <div key={categoria} className="categoria-group">
            <h4 className="categoria-title">{categoria}</h4>
            <div className="tabla-scroll">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Subcategoría</th>
                    <th>Precio</th>
                    <th>Unidades Tienda</th>
                    <th>Unidades Fábrica</th>
                    <th>Total Unidades</th>
                    <th>Valor Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedInventory[categoria].map((item) => {
                    const totalUnidades = (item.cantidad || 0) + (item.stock_fabrica || 0);
                    const valorTotal = totalUnidades * (item.precio || 0);
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          {editingId === item.id ? (
                            <input
                              value={editForm.nombre}
                              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            />
                          ) : item.nombre}
                        </td>
                        <td>
                          {editingId === item.id ? (
                            <input
                              value={editForm.subcategoria}
                              onChange={(e) => setEditForm({ ...editForm, subcategoria: e.target.value })}
                            />
                          ) : item.subcategoria}
                        </td>
                        <td>
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editForm.precio}
                              onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                            />
                          ) : (
                            formatPrice(item.precio)
                          )}
                        </td>
                        <td>
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editForm.cantidad}
                              onChange={(e) => setEditForm({ ...editForm, cantidad: e.target.value })}
                            />
                          ) : item.cantidad}
                        </td>
                        <td>
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editForm.stock_fabrica}
                              onChange={(e) => setEditForm({ ...editForm, stock_fabrica: e.target.value })}
                            />
                          ) : (item.stock_fabrica || 0)}
                        </td>
                        <td>{totalUnidades}</td>
                        <td>{formatPrice(valorTotal)}</td>
                        <td>
                          {editingId === item.id ? (
                            <>
                              <button onClick={() => handleUpdate(item.id)}>Guardar</button>
                              <button onClick={() => setEditingId(null)}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(item)}>✏️</button>
                              <button onClick={() => handleDelete(item.id)}>🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default InventoryPanel;
