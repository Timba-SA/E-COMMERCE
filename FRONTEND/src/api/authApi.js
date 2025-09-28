import axiosClient from '../hooks/axiosClient';

export const loginUser = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  try {
    const response = await axiosClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during login:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

export const forgotPasswordAPI = async (email) => {
  try {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error en forgot password:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

export const resetPasswordAPI = async (token, new_password) => {
  try {
    const response = await axiosClient.post('/auth/reset-password', { token, new_password });
    return response.data;
  } catch (error) {
    console.error('Error en reset password:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};
// En FRONTEND/src/api/authApi.js

// ... (las otras funciones como login, register, forgotPassword van acá arriba)

/**
 * Envía la nueva contraseña y el token al backend para resetearla.
 * @param {string} token - El token recibido en el email.
 * @param {string} newPassword - La nueva contraseña del usuario.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosClient.post('/api/auth/reset-password', {
      token: token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    // Si el backend tira un error (token inválido, etc.), lo pasamos para que la página lo muestre.
    throw error.response.data;
  }
};