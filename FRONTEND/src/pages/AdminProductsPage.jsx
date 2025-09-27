import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProductAPI } from '../api/productsApi'; // 1. Importar las funciones de API correctas
import { NotificationContext } from '../context/NotificationContext';
import Spinner from '../components/common/Spinner';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { notify } = useContext(NotificationContext);

  // La dependencia del token ya no es necesaria, axios se encarga
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        // 2. Usar la función getProducts de la API
        const data = await getProducts({ limit: 100 }); 
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los productos.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto de forma permanente?')) {
      return;
    }
    try {
      // 3. Usar la función deleteProductAPI de la API
      await deleteProductAPI(productId);
      setProducts(products.filter(p => p.id !== productId));
      notify('Producto eliminado con éxito.', 'success');
    } catch (err) {
      notify(`Error: ${err.detail || 'No se pudo eliminar el producto.'}` , 'error');
    }
  };

  if (loading) return <Spinner message="Cargando inventario..." />;

  return (
    <div>
      <div className="admin-header">
        <h1>Gestión de Productos</h1>
        <Link to="/admin/products/new" className="add-product-btn">Añadir Producto</Link>
      </div>

      {error && <h2 className="error-message" style={{marginBottom: '1rem', color: 'red'}}>{error}</h2>}
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock (Variantes)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map(product => {
              const totalStockFromVariants = (product.variantes || []).reduce(
                (sum, variant) => sum + variant.cantidad_en_stock, 0
              );

              return (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.nombre}</td>
                  <td>${product.precio}</td>
                  <td>{totalStockFromVariants}</td>
                  <td className="actions-cell">
                    <Link to={`/admin/products/edit/${product.id}`} className="action-btn edit">Editar</Link>
                    <Link to={`/admin/products/${product.id}/variants`} className="action-btn variants">Variantes</Link>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDelete(product.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No hay productos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProductsPage;
