import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProduct, updateProduct } from '../api/productsApi';
import { getCategories } from '../api/categoriesApi';
import { NotificationContext } from '../context/NotificationContext';
import Spinner from '../components/common/Spinner';

const AdminProductFormPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { notify } = useContext(NotificationContext);

    const [productData, setProductData] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        sku: '',
        stock: 0,
        categoria_id: '', // Inicializar vacío para forzar selección
        material: '',
        talle: '',
        color: '',
    });
    
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const isEditing = Boolean(productId);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const categoriesData = await getCategories();
                setCategories(categoriesData);

                if (isEditing) {
                    const productToEdit = await getProductById(productId);
                    setProductData({
                        nombre: productToEdit.nombre || '',
                        descripcion: productToEdit.descripcion || '',
                        precio: productToEdit.precio || 0,
                        sku: productToEdit.sku || '',
                        stock: productToEdit.stock || 0,
                        categoria_id: productToEdit.categoria_id || '',
                        material: productToEdit.material || '',
                        talle: productToEdit.talle || '',
                        color: productToEdit.color || '',
                    });
                    setExistingImages(productToEdit.urls_imagenes || []);
                }
            } catch (err) {
                notify(err.message || 'Error loading data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [productId, isEditing, notify]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = name === 'categoria_id' ? parseInt(value, 10) :
                            type === 'number' ? parseFloat(value) || 0 : value;
        setProductData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 3) {
            notify('Solo puedes subir hasta 3 imágenes nuevas.', 'error');
            e.target.value = null;
            return;
        }
        setImageFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing) {
                await updateProduct(productId, productData);
            } else {
                const formData = new FormData();
                for (const key in productData) {
                    formData.append(key, productData[key]);
                }
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });
                await createProduct(formData);
            }
            notify(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`, 'success');
            navigate('/admin/products');
        } catch (err) {
            notify(err.detail || 'Ocurrió un error al guardar el producto.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !categories.length) return <Spinner message="Cargando datos..." />;

    return (
        <div>
          <h1>{isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h1>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">
              {Object.keys(productData).filter(key => key !== 'categoria_id').map(key => (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>{key.replace(/_/g, ' ').toUpperCase()}</label>
                  <input
                    type={key.includes('precio') || key.includes('stock') || key.includes('id') ? 'number' : 'text'}
                    id={key}
                    name={key}
                    value={productData[key]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
              
              <div className="form-group">
                <label htmlFor="categoria_id">CATEGORÍA</label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  value={productData.categoria_id}
                  onChange={handleChange}
                  required
                  style={{
                      width: '100%',
                      padding: '0.5rem 0',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #000',
                      fontSize: '1rem',
                  }}
                >
                  <option value="" disabled>-- Seleccione una categoría --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
    
            <div className="form-group" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
                <label htmlFor="images">AÑADIR IMÁGENES (hasta 3)</label>
                <input type="file" id="images" name="images" multiple accept="image/*" onChange={handleFileChange} disabled={isEditing} />
                {isEditing && <p style={{fontSize: '0.8rem', color: '#888'}}>La edición de imágenes no está soportada en este formulario.</p>}
                {isEditing && existingImages.length > 0 && (
                    <div style={{marginTop: '10px'}}>
                        <p>Imágenes actuales:</p>
                        <div style={{display: 'flex', gap: '10px'}}>
                            {existingImages.map(img => <img key={img} src={img} alt="preview" width="60" style={{border: '1px solid #ddd'}}/>)}
                        </div>
                    </div>
                )}
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </form>
        </div>
      );
};

export default AdminProductFormPage;