import axiosClient from '../hooks/axiosClient';

export const getProducts = async (params = {}) => {
  try {
    const response = await axiosClient.get('/products/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
};

export const deleteProductAPI = async (id) => {
  try {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product with id ${id}:`, error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

// --- NUEVA FUNCIÓN ---
export const getCategoriesAPI = async () => {
  try {
    const response = await axiosClient.get('/categories/');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// --- Funciones Añadidas ---

export const createProductAPI = async (formData) => {
  try {
    // Al enviar FormData, axios establece automáticamente el Content-Type a multipart/form-data
    const response = await axiosClient.post('/products/', formData, {
      headers: {
        // No establecer 'Content-Type': 'multipart/form-data' manualmente, axios lo hace.
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};

export const updateProductAPI = async (id, productData) => {
  try {
    // Para actualizar, el backend espera un JSON normal
    const response = await axiosClient.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product with id ${id}:`, error.response?.data?.detail || error.message);
    throw error.response?.data || error;
  }
};