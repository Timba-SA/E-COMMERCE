import axiosClient from '../hooks/axiosClient';

export const loginUser = async (email, password) => {
  // El backend espera los datos como 'application/x-www-form-urlencoded'
  const params = new URLSearchParams();
  params.append('username', email); // El backend usa 'username' para el email en este form
  params.append('password', password);

  try {
    const response = await axiosClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // Devuelve { access_token: "...", token_type: "bearer" }
  } catch (error) {
    console.error('Error during login:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

export const registerUser = async (userData) => {
  // userData debe ser un objeto como { email, password, nombre, apellido, etc. }
  try {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};
