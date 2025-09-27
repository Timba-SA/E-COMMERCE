import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi'; // 1. Importar la nueva función de API
import { NotificationContext } from '../context/NotificationContext'; // 2. Importar el contexto de notificación

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    phonePrefix: '+54',
    phoneNumber: '',
    acceptPrivacy: false,
  });
  
  // 3. Usaremos el contexto para errores y éxito, no estados locales
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acceptPrivacy) {
      notify('Debes aceptar la declaración de privacidad para continuar.', 'error');
      return;
    }

    try {
      const apiPayload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        last_name: formData.lastName, // El backend espera last_name
        phone: {
          prefix: formData.phonePrefix,
          number: formData.phoneNumber,
        },
      };

      // 4. Usar la función de API centralizada
      await registerUser(apiPayload);

      notify('¡Cuenta creada con éxito! Serás redirigido al login.', 'success');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      const errorMessage = err.detail || 'Ocurrió un error al registrar la cuenta.';
      notify(errorMessage, 'error');
      console.error('Error en el registro:', err);
    }
  };

  return (
    <main className="register-page-container">
      <h1 className="form-title">REGISTER</h1>
      <form onSubmit={handleSubmit} className="register-form">
        {/* Los campos del formulario no cambian, solo la lógica de envío */}
        <div className="input-group">
          <label htmlFor="email">E-MAIL</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label htmlFor="password">PASSWORD</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label htmlFor="name">NAME</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label htmlFor="lastName">LAST NAME</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>

        <div className="phone-input-group">
          <div className="input-group prefix">
            <label htmlFor="phonePrefix">PREFIX</label>
            <input type="text" id="phonePrefix" name="phonePrefix" value={formData.phonePrefix} onChange={handleChange} />
          </div>
          <div className="input-group phone-number">
            <label htmlFor="phoneNumber">PHONE</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-container-register">
            <input type="checkbox" name="acceptPrivacy" checked={formData.acceptPrivacy} onChange={handleChange} />
            <span className="checkmark-register"></span>
            I ACCEPT THE <Link to="/privacy" className="privacy-link">PRIVACY STATEMENT</Link>
          </label>
        </div>

        {/* Los mensajes de error/éxito ahora se manejan por el sistema de notificaciones global */}

        <button type="submit" className="form-button outline">CREATE AN ACCOUNT</button>
      </form>
    </main>
  );
};

export default RegisterPage;
