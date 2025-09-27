import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProductAPI, updateProductAPI } from '../api/productsApi'; // 1. Importar todas las funciones necesarias
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
        stock: 0, // Este stock es para variantes si no se especifican
        categoria_id: 1,
        material: '',
        talle: '',
        color: '',
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const isEditing = Boolean(productId);

    useEffect(() => {
        if (isEditing) {
            setLoading(true);
            const fetchProduct = async () => {
                try {
                    // 2. Usar la función de API para obtener el producto
                    const data = await getProductById(productId);
                    setProductData({
                        nombre: data.nombre || '',
                        descripcion: data.descripcion || '',
                        precio: data.precio || 0,
                        sku: data.sku || '',
                        stock: data.stock || 0,
                        categoria_id: data.categoria_id || 1,
                        material: data.material || '',
                        talle: data.talle || '',
                        color: data.color || '',
                    });
                    setExistingImages(data.urls_imagenes || []);
                } catch (err) {
                    notify(err.message, 'error');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [productId, isEditing, notify]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setProductData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
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
                // 3. Al editar, enviar JSON con updateProductAPI
                // Nota: Esta implementación no maneja la actualización de imágenes.
                await updateProductAPI(productId, productData);
            } else {
                // 4. Al crear, enviar FormData con createProductAPI
                const formData = new FormData();
                for (const key in productData) {
                    formData.append(key, productData[key]);
                }
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });
                await createProductAPI(formData);
            }
            notify(`Producto ${isEditing ? 'actualizado' : 'creado'} con éxito!`, 'success');
            navigate('/admin/products');
        } catch (err) {
            notify(err.detail || 'Ocurrió un error al guardar el producto.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isEditing && loading) return <Spinner message="Cargando producto..." />;

    return (
        <div>
          <h1>{isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h1>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">
              {Object.keys(productData).map(key => (
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
