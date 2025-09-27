import axiosClient from '../hooks/axiosClient';

/**
 * Obtiene la última dirección de envío guardada para el usuario actual.
 * @returns {Promise<object>} El objeto de la dirección de envío.
 */
export const getLastAddressAPI = async () => {
  try {
    const response = await axiosClient.get('/user/address');
    return response.data;
  } catch (error) {
    // Un 404 aquí es normal si el usuario nunca ha guardado una dirección, no lo logueamos como error.
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching last address:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};
