import axios from "axios";
import { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setUsuario }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Forzar estilos al montar el componente
  useEffect(() => {
    // Guardar estilos originales
    const originalBodyBg = document.body.style.background;
    const originalBodyMargin = document.body.style.margin;
    const originalRootStyle = document.getElementById("root")?.getAttribute("style");
    // Aplicar estilos nuevos
    document.body.style.background = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    
    const root = document.getElementById("root");
    if (root) {
      root.style.width = "100%";
      root.style.maxWidth = "none";
      root.style.border = "none";
      root.style.background = "transparent";
      root.style.display = "flex";
      root.style.alignItems = "center";
      root.style.justifyContent = "center";
      root.style.minHeight = "100vh";
      root.style.margin = "0";
      root.style.padding = "0";
    }

    // Limpiar al desmontar (cuando se inicia sesión)
    return () => {
      document.body.style.background = originalBodyBg;
      document.body.style.margin = originalBodyMargin;
      if (root && originalRootStyle !== null) {
        root.setAttribute("style", originalRootStyle);
      } else if (root) {
        root.removeAttribute("style");
      }
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !password.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, {
        nombre: nombre.trim(),
        password,
      });
      setUsuario(res.data);
    } catch (err) {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modern-container">
      <div className="login-modern-card">
        <div className="login-modern-header">
          <h1>🥟 Congelador Lucky</h1>
          <p>Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-modern-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Usuario"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="input-modern-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-modern"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <div className="login-error-modern">{error}</div>}

          <button type="submit" className="login-button-modern" disabled={loading}>
            {loading ? <span className="spinner-modern"></span> : "Iniciar Sesión"}
          </button>
        </form>

        <div className="login-footer-modern">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
