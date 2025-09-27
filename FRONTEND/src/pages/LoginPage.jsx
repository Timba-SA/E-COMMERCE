import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore'; // 1. Importar el store de Zustand
import { loginUser } from '../api/authApi'; // 2. Importar la nueva función de API
import { NotificationContext } from '../context/NotificationContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // 3. Obtener la acción de login desde el store
  const { login } = useAuthStore(); 
  
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 4. Usar la función de API centralizada
      const data = await loginUser(email, password);

      // 5. Llamar a la acción del store para actualizar el estado global
      await login(data.access_token);
      
      notify('Inicio de sesión exitoso', 'success');
      navigate('/'); // Redirigir a la página de inicio

    } catch (err) {
      const errorMessage = err.detail || 'Error al iniciar sesión. Revisa tus credenciales.';
      setError(errorMessage);
      notify(errorMessage, 'error');
    }
  };

  return (
    <main className="login-page-container">
      <div className="login-form-section">
        <h1 className="form-title">LOG IN</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">E-MAIL</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">PASSWORD</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Link to="/forgot-password" className="forgot-password-link">FORGOT PASSWORD?</Link>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="form-button">LOG IN</button>
        </form>
      </div>

      <div className="signup-section">
        <h2 className="form-subtitle">ARE YOU NOT REGISTERED YET?</h2>
        <p className="signup-text">CREATE AN ACCOUNT</p>
        {/* El Link a /register es más apropiado que /signup basado en la estructura de archivos */}
        <Link to="/register" className="form-button">SIGN UP</Link>
      </div>
    </main>
  );
};

export default LoginPage;
