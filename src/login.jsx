import axios from "axios";
import { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaStore } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import "./App.css";

function Login({ setUsuario }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Forzar estilos al montar el componente
  useEffect(() => {
    document.body.classList.add("login-active");
    return () => {
      document.body.classList.remove("login-active");
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
      setError("Credenciales inválidas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modern-container">
      <div className="login-background-overlay"></div>
      <div className="login-modern-card">
        <div className="login-logo-section">
          <div className="logo-icon">
            <FaStore />
          </div>
          <h1>Congelados Lucky</h1>
          <p>Sistema de Punto de Venta</p>
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

          <div className="login-options">
            <label className="remember-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordarme</span>
            </label>
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          {error && <div className="login-error-modern">{error}</div>}

          <button type="submit" className="login-button-modern" disabled={loading}>
            {loading ? (
              <span className="spinner-modern"></span>
            ) : (
              <>
                <FiLogIn className="button-icon" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer-modern">
          <p>© 2024 Congelados Lucky - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
