import React, { useState, useEffect } from "react";
import "./POS.css";
import VentasGrafico from "./VentasGrafico";
import { supabase } from "./supabaseClient";
import logo2 from "./logo_2.jpeg";

function POS({ usuario, inventario, registrarVenta, actualizarInventario, mensajeInventario, refreshTrigger, cerrarSesion, setMensajeInventario, setRefreshTrigger }) {
  const [combos, setCombos] = useState([]);
  const [mostrarLogo, setMostrarLogo] = useState(false);
  // Carrito temporal
  const [carrito, setCarrito] = useState([]);

  // Estados para subcategorías
  const [mostrarModalSubcategorias, setMostrarModalSubcategorias] = useState(false);
  const [subcategorias, setSubcategorias] = useState([]);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  // ====== ESTADOS PARA EMPANADAS ======
const [mostrarModalEmpanadas, setMostrarModalEmpanadas] = useState(false);
const [subcategoriasEmpanadas, setSubcategoriasEmpanadas] = useState([]);
const [subcategoriaEmpanadaSeleccionada, setSubcategoriaEmpanadaSeleccionada] = useState(null);
const [cantidadEmpanada, setCantidadEmpanada] = useState(1);
  // ====== ESTADOS PARA OTROS (Medallones y Bolitas) ======
const [mostrarModalOtros, setMostrarModalOtros] = useState(false);
const [subcategoriasOtros, setSubcategoriasOtros] = useState([]);
const [subcategoriaOtrosSeleccionada, setSubcategoriaOtrosSeleccionada] = useState(null);
const [cantidadOtros, setCantidadOtros] = useState(1);
  // ====== ESTADOS PARA COMBOS ======
const [mostrarModalCombos, setMostrarModalCombos] = useState(false);
const [comboSeleccionado, setComboSeleccionado] = useState(null);
const [cantidadCombo, setCantidadCombo] = useState(1);
  // Cargar combos
  useEffect(() => {
    const fetchCombos = async () => {
      const { data, error } = await supabase.from("combos").select("*");
      if (error) {
        console.error("Error cargando combos:", error);
      } else {
        setCombos(data);
      }
    };
    fetchCombos();
  }, []);

  // Abrir modal con subcategorías de Deditos
  const abrirModalDeditos = () => {
    const deditos = inventario.filter(item => item.categoria.toLowerCase() === "deditos");
    setSubcategorias(deditos);
    setMostrarModalSubcategorias(true);
  };
  // Abrir modal con subcategorías de Empanadas
const abrirModalEmpanadas = () => {
  const empanadas = inventario.filter(item => item.categoria.toLowerCase() === "empanadas");
  setSubcategoriasEmpanadas(empanadas);
  setMostrarModalEmpanadas(true);
};
  // Abrir modal con subcategorías de Medallones y Bolitas
const abrirModalOtros = () => {
  const otros = inventario.filter(item =>
    item.categoria.toLowerCase() === "medallones" ||
    item.categoria.toLowerCase() === "bolitas"
  );
  setSubcategoriasOtros(otros);
  setMostrarModalOtros(true);
};
  // Abrir modal con todos los combos
const abrirModalCombos = () => {
  setMostrarModalCombos(true);
};
  
  // Seleccionar una subcategoría
  const seleccionarSubcategoria = (item) => {
    setSubcategoriaSeleccionada(item);
    setCantidad(1);
  };
  // Seleccionar una subcategoría de Empanadas
const seleccionarSubcategoriaEmpanada = (item) => {
  setSubcategoriaEmpanadaSeleccionada(item);
  setCantidadEmpanada(1);
};
  // Seleccionar una subcategoría de Otros
const seleccionarSubcategoriaOtros = (item) => {
  setSubcategoriaOtrosSeleccionada(item);
  setCantidadOtros(1);
};
  // Seleccionar un combo
const seleccionarCombo = (combo) => {
  setComboSeleccionado(combo);
  setCantidadCombo(1);
};
  // Confirmar venta de combo
const confirmarVentaCombo = () => {
  if (!comboSeleccionado) return;
  registrarVenta({
    ...comboSeleccionado,
    cantidad: cantidadCombo,
    total: cantidadCombo * comboSeleccionado.precio
  });
  setMostrarModalCombos(false);
  setComboSeleccionado(null);
};

  // Confirmar venta
  const confirmarVenta = () => {
    if (!subcategoriaSeleccionada) return;
    registrarVenta({
      ...subcategoriaSeleccionada,
      cantidad,
      total: cantidad * subcategoriaSeleccionada.precio
    });
    setMostrarModalSubcategorias(false);
    setSubcategoriaSeleccionada(null);
  };
  // Confirmar venta de Empanadas
const confirmarVentaEmpanada = () => {
  if (!subcategoriaEmpanadaSeleccionada) return;
  registrarVenta({
    ...subcategoriaEmpanadaSeleccionada,
    cantidad: cantidadEmpanada,
    total: cantidadEmpanada * subcategoriaEmpanadaSeleccionada.precio
  });
  setMostrarModalEmpanadas(false);
  setSubcategoriaEmpanadaSeleccionada(null);
};
  // Confirmar venta de Otros
const confirmarVentaOtros = () => {
  if (!subcategoriaOtrosSeleccionada) return;
  registrarVenta({
    ...subcategoriaOtrosSeleccionada,
    cantidad: cantidadOtros,
    total: cantidadOtros * subcategoriaOtrosSeleccionada.precio
  });
  setMostrarModalOtros(false);
  setSubcategoriaOtrosSeleccionada(null);
};
 const agregarAlCarrito = (producto, cantidad) => {
  const item = {
    id: producto.id, // necesario para el backend
    nombre: producto.subcategoria || producto.nombre,
    precio: producto.precio,
    cantidad: cantidad,
    subtotal: cantidad * producto.precio
  };
  setCarrito(prev => [...prev, item]);
};
const registrarVentaFinal = async () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  try {
    for (const item of carrito) {
      console.log("Registrando venta:", {
        producto_id: item.id,
        cantidad: item.cantidad,
        total: item.subtotal,
        cajero_id: usuario.id
      });

      await axios.post(
        `${API_URL}/venta?cajero_id=${usuario.id}`,
        {
          producto_id: item.id,
          cantidad: item.cantidad,
          total: item.subtotal
        }
      );
    }

    alert("Venta del carrito registrada con éxito");
    setCarrito([]);
  } catch (error) {
    console.error("Error en registrarVentaFinal:", error.response?.data || error);
    alert("Error registrando la venta del carrito");
  }
};



  return (
    <div className="pos-container">
      <header className="pos-header">
        <div className="pos-header-left">
          <button className="logout-btn" onClick={cerrarSesion}>🚪 Cerrar sesión</button>
        </div>
        <h1 className="pos-title">TPV - {usuario.nombre}</h1>
        <div className="pos-header-right">
          <button className="refresh-btn" onClick={() => actualizarInventario(true)}>🔄 Actualizar inventario</button>
        </div>
      </header>

      {mensajeInventario && <div className="mensaje-inventario">{mensajeInventario}</div>}

      <div className="pos-layout">
        <aside className="pos-sidebar-left">
          <img src={logo2} alt="Logo empresa" className="pos-logo" onClick={() => setMostrarLogo(true)} />
        </aside>

        <main className="pos-main">
          <VentasGrafico usuario={usuario} refreshTrigger={refreshTrigger} />

          {/* Card de Deditos */}
          <h3>Categorías principales</h3>
          <div className="product-card" onClick={abrirModalDeditos}>
            <h3>Deditos</h3>
            <p className="info">Haz clic para ver subcategorías</p>
          </div>

          {/* Card de Empanadas */}
        <h3>Categorías principales</h3>
        <div className="product-card" onClick={abrirModalEmpanadas}>
        <h3>Empanadas</h3>
        <p className="info">Haz clic para ver subcategorías</p>
        </div>
          
          {/* Card de Otros */}
          <h3>Categorías principales</h3>
        <div className="product-card" onClick={abrirModalOtros}>
        <h3>Medallones , Bolitas y otros</h3>
        <p className="info">Haz clic para ver subcategorías</p>
        </div>
          
          {/* Bloque Combos */}
            <h3>Categorias principales</h3>
            <div className="product-card" onClick={abrirModalCombos}>
            <h3>Combos</h3>
            <p className="info">Haz clic para ver todos los combos</p>
            </div>
          </main>
   
        <aside className="pos-sidebar-right">
        <img 
        src={logo2} 
        alt="Logo empresa" 
        className="pos-logo" 
        onClick={() => setMostrarLogo(true)} 
        />
        </aside>
      </div>

      {/* Modal de subcategorías de Deditos */}
{mostrarModalSubcategorias && (
  <div className="modal-overlay" onClick={() => setMostrarModalSubcategorias(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {!subcategoriaSeleccionada ? (
        <>
          <h3>Subcategorías de Deditos</h3>
          <ul>
            {subcategorias.map(item => (
              <li key={item.id} className="subcategoria-item">
                <p><strong>{item.subcategoria}</strong></p>
                <p>Precio: ${item.precio}</p>
                <p>Stock: {item.cantidad}</p>
                <button onClick={() => seleccionarSubcategoria(item)}>Seleccionar</button>
              </li>
            ))}
          </ul>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>

            {/* 🔹 Botón para registrar todo el carrito */}
            {carrito.length > 0 && (
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar venta del carrito
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Venta de {subcategoriaSeleccionada.subcategoria}</h3>
          <p>Precio unitario: ${subcategoriaSeleccionada.precio}</p>
          <p>Stock disponible: {subcategoriaSeleccionada.cantidad}</p>
          <div className="cantidad-selector">
            <button className="volver-btn" onClick={() => setSubcategoriaSeleccionada(null)}>⬅️ Volver</button>
            <button onClick={() => cantidad > 1 && setCantidad(cantidad - 1)}>-</button>
            <input
              type="number"
              min="1"
              max={subcategoriaSeleccionada.cantidad}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value))}
            />
            <button onClick={() => cantidad < subcategoriaSeleccionada.cantidad && setCantidad(cantidad + 1)}>+</button>
          </div>
          <p>Total: ${cantidad * subcategoriaSeleccionada.precio}</p>

          {/* 🔹 Botón para agregar al carrito */}
          <button
            className="agregar-btn"
            onClick={() => {
              agregarAlCarrito(subcategoriaSeleccionada, cantidad);
              setSubcategoriaSeleccionada(null); // vuelve a la lista
            }}
          >
            ➕ Agregar al carrito
          </button>

          {/* 🔹 Botón para registrar venta individual */}
          <button className="registrar-btn" onClick={confirmarVenta}>
            Registrar venta
          </button>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>
          </div>
        </>
      )}
    </div>
  </div>
)}


      {/* Modal de subcategorías de Empanadas */}
{mostrarModalEmpanadas && (
  <div className="modal-overlay" onClick={() => setMostrarModalEmpanadas(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {!subcategoriaEmpanadaSeleccionada ? (
        <>
          <h3>Subcategorías de Empanadas</h3>
          <ul>
            {subcategoriasEmpanadas.map(item => (
              <li key={item.id} className="subcategoria-item">
                <p><strong>{item.subcategoria}</strong></p>
                <p>Precio: ${item.precio}</p>
                <p>Stock: {item.cantidad}</p>
                <button onClick={() => setSubcategoriaEmpanadaSeleccionada(item)}>Seleccionar</button>
              </li>
            ))}
          </ul>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>

            {/* 🔹 Botón para registrar todo el carrito */}
            {carrito.length > 0 && (
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar venta del carrito
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Venta de {subcategoriaEmpanadaSeleccionada.subcategoria}</h3>
          <p>Precio unitario: ${subcategoriaEmpanadaSeleccionada.precio}</p>
          <p>Stock disponible: {subcategoriaEmpanadaSeleccionada.cantidad}</p>
          <div className="cantidad-selector">
            <button className="volver-btn" onClick={() => setSubcategoriaEmpanadaSeleccionada(null)}>⬅️ Volver</button>
            <button onClick={() => cantidadEmpanada > 1 && setCantidadEmpanada(cantidadEmpanada - 1)}>-</button>
            <input
              type="number"
              min="1"
              max={subcategoriaEmpanadaSeleccionada.cantidad}
              value={cantidadEmpanada}
              onChange={(e) => setCantidadEmpanada(parseInt(e.target.value))}
            />
            <button onClick={() => cantidadEmpanada < subcategoriaEmpanadaSeleccionada.cantidad && setCantidadEmpanada(cantidadEmpanada + 1)}>+</button>
          </div>
          <p>Total: ${cantidadEmpanada * subcategoriaEmpanadaSeleccionada.precio}</p>

          {/* 🔹 Botón para agregar al carrito */}
          <button
            className="agregar-btn"
            onClick={() => {
              agregarAlCarrito(subcategoriaEmpanadaSeleccionada, cantidadEmpanada);
              setSubcategoriaEmpanadaSeleccionada(null); // vuelve a la lista
            }}
          >
            ➕ Agregar al carrito
          </button>

          {/* 🔹 Botón para registrar venta individual */}
          <button className="registrar-btn" onClick={confirmarVentaEmpanada}>
            Registrar venta
          </button>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>
          </div>
        </>
      )}
    </div>
  </div>
)}


     {/* Modal de subcategorías de Otros */}
{mostrarModalOtros && (
  <div className="modal-overlay" onClick={() => setMostrarModalOtros(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {!subcategoriaOtrosSeleccionada ? (
        <>
          <h3>Subcategorías de Otros</h3>
          <ul>
            {subcategoriasOtros.map(item => (
              <li key={item.id} className="subcategoria-item">
                <p><strong>{item.subcategoria}</strong></p>
                <p>Precio: ${item.precio}</p>
                <p>Stock: {item.cantidad}</p>
                <button onClick={() => setSubcategoriaOtrosSeleccionada(item)}>Seleccionar</button>
              </li>
            ))}
          </ul>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>

            {/* 🔹 Botón para registrar todo el carrito */}
            {carrito.length > 0 && (
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar venta del carrito
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Venta de {subcategoriaOtrosSeleccionada.subcategoria}</h3>
          <p>Precio unitario: ${subcategoriaOtrosSeleccionada.precio}</p>
          <p>Stock disponible: {subcategoriaOtrosSeleccionada.cantidad}</p>
          <div className="cantidad-selector">
            <button className="volver-btn" onClick={() => setSubcategoriaOtrosSeleccionada(null)}>⬅️ Volver</button>
            <button onClick={() => cantidadOtros > 1 && setCantidadOtros(cantidadOtros - 1)}>-</button>
            <input
              type="number"
              min="1"
              max={subcategoriaOtrosSeleccionada.cantidad}
              value={cantidadOtros}
              onChange={(e) => setCantidadOtros(parseInt(e.target.value))}
            />
            <button onClick={() => cantidadOtros < subcategoriaOtrosSeleccionada.cantidad && setCantidadOtros(cantidadOtros + 1)}>+</button>
          </div>
          <p>Total: ${cantidadOtros * subcategoriaOtrosSeleccionada.precio}</p>

          {/* 🔹 Botón para agregar al carrito */}
          <button
            className="agregar-btn"
            onClick={() => {
              agregarAlCarrito(subcategoriaOtrosSeleccionada, cantidadOtros);
              setSubcategoriaOtrosSeleccionada(null); // vuelve a la lista
            }}
          >
            ➕ Agregar al carrito
          </button>

          {/* 🔹 Botón para registrar venta individual */}
          <button className="registrar-btn" onClick={confirmarVentaOtros}>
            Registrar venta
          </button>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>
          </div>
        </>
      )}
    </div>
  </div>
)}

    {/* Modal de Combos */}
{mostrarModalCombos && (
  <div className="modal-overlay" onClick={() => setMostrarModalCombos(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {!comboSeleccionado ? (
        <>
          <h3>Lista de Combos</h3>
          <ul>
            {combos.map(combo => (
              <li key={combo.id} className="subcategoria-item">
                <p><strong>{combo.nombre}</strong></p>
                <p>Precio: ${combo.precio}</p>
                <button onClick={() => seleccionarCombo(combo)}>Seleccionar</button>
              </li>
            ))}
          </ul>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>

            {/* 🔹 Botón para registrar todo el carrito */}
            {carrito.length > 0 && (
              <button className="registrar-btn" onClick={registrarVentaFinal}>
                Registrar venta del carrito
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Venta de {comboSeleccionado.nombre}</h3>
          <p>Precio unitario: ${comboSeleccionado.precio}</p>
          <div className="cantidad-selector">
            {/* Botón Volver */}
            <button className="volver-btn" onClick={() => setComboSeleccionado(null)}>⬅️ Volver</button>

            <button onClick={() => cantidadCombo > 1 && setCantidadCombo(cantidadCombo - 1)}>-</button>
            <input
              type="number"
              min="1"
              value={cantidadCombo}
              onChange={(e) => setCantidadCombo(parseInt(e.target.value))}
            />
            <button onClick={() => setCantidadCombo(cantidadCombo + 1)}>+</button>
          </div>
          <p>Total: ${cantidadCombo * comboSeleccionado.precio}</p>

          {/* 🔹 Botón para agregar al carrito */}
          <button
            className="agregar-btn"
            onClick={() => {
              agregarAlCarrito(comboSeleccionado, cantidadCombo);
              setComboSeleccionado(null); // vuelve a la lista
              setCantidadCombo(1);        // reset cantidad
            }}
          >
            ➕ Agregar al carrito
          </button>

          {/* 🔹 Botón para registrar venta individual */}
          <button className="registrar-btn" onClick={confirmarVentaCombo}>
            Registrar venta
          </button>

          {/* 🔹 Carrito dentro del modal */}
          <div className="carrito-modal">
            <h4>Carrito actual</h4>
            {carrito.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <ul>
                {carrito.map((item, index) => (
                  <li key={index}>
                    {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
                  </li>
                ))}
              </ul>
            )}
            <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>
          </div>
        </>
      )}
    </div>
  </div>
)}

      <div className="carrito">
  <h3>Carrito actual</h3>
  {carrito.length === 0 ? (
    <p>No hay productos en el carrito</p>
  ) : (
    <ul>
      {carrito.map((item, index) => (
        <li key={index}>
          {item.nombre} - {item.cantidad} x ${item.precio} = ${item.subtotal}
        </li>
      ))}
    </ul>
  )}
  <p><strong>Total parcial:</strong> ${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</p>

  {/* Botón para registrar todo el carrito */}
  {carrito.length > 0 && (
    <button className="registrar-btn" onClick={registrarVentaFinal}>
      Registrar venta final
    </button>
  )}
</div>

      {/* Modal para logo */}
      {mostrarLogo && (
        <div className="modal-overlay" onClick={() => setMostrarLogo(false)}>
          <div className="modal-content">
            <img src={logo2} alt="Logo empresa grande" className="logo-grande" />
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
