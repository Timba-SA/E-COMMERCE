// En FRONTEND/src/pages/ResetPasswordPage.jsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/authApi'; // Importamos la función que creamos
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const ResetPasswordPage = () => {
  // useParams() saca el token de la URL (ej: /reset-password/ESTE_ES_EL_TOKEN)
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Verificamos que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden, animal.');
      return;
    }

    // Verificamos que la contraseña no sea muy corta
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      // Llamamos a la API con el token de la URL y la nueva contraseña
      const data = await resetPassword(token, password);
      setSuccess(data.message + ' Serás redirigido en 3 segundos...');

      // Si todo sale bien, esperamos 3 segundos y lo mandamos al login
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      // Si el backend se queja, mostramos el error que nos manda
      setError(err.detail || 'Ocurrió un error. El token puede ser inválido o haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Crear Nueva Contraseña</h2>
        
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Nueva Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputField
              label="Confirmar Nueva Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? <Spinner size="sm" /> : 'Cambiar Contraseña'}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-500 text-lg">{success}</p>
            <Link to="/login" className="text-blue-600 hover:underline mt-4 block">
              O ir a iniciar sesión ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;