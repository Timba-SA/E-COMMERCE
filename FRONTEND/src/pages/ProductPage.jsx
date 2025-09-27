import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { getProductById } from '../api/productsApi';
import Spinner from '../components/common/Spinner';

const transformCloudinaryUrl = (url, width) => {
  if (!url || !url.includes('cloudinary')) return url;
  const parts = url.split('/upload/');
  return `${parts[0]}/upload/f_auto,q_auto:best,w_${width}/${parts[1]}`;
};

const getSafeImageUrls = (urls) => {
    if (Array.isArray(urls) && urls.length > 0) {
        return urls;
    }
    return ['/img/placeholder.jpg'];
};

const ProductPage = ({ onOpenCartModal, onSetAddedItem }) => {
    const { productId } = useParams();
    const { addItemToCart } = useContext(CartContext);
    const { notify } = useContext(NotificationContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [allImageUrls, setAllImageUrls] = useState([]);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                const data = await getProductById(productId);
                setProduct(data);

                const imageUrls = getSafeImageUrls(data.urls_imagenes);
                setAllImageUrls(imageUrls);
                setMainImage(imageUrls[0]);

                if (data.variantes && data.variantes.length > 0) {
                    setSelectedSize(data.variantes[0].tamanio);
                }

            } catch (err) {
                const errorMessage = err.detail || 'No se pudo encontrar el producto.';
                setError(errorMessage);
                notify(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
        window.scrollTo(0, 0);
    }, [productId, notify]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            notify("Por favor, selecciona un talle.", "error");
            return;
        }

        const selectedVariant = product.variantes.find(v => v.tamanio === selectedSize);

        if (!selectedVariant || selectedVariant.cantidad_en_stock <= 0) {
            notify("Esta variante no tiene stock disponible.", "error");
            return;
        }

        const itemToAdd = {
            variante_id: selectedVariant.id,
            quantity: 1,
            price: product.precio,
            name: product.nombre,
            image_url: allImageUrls[0] || null
        };
        
        addItemToCart(itemToAdd);
        
        const notificationItem = {
            ...itemToAdd,
            size: selectedVariant.tamanio,
        }
        onSetAddedItem(notificationItem);
        onOpenCartModal();
    };

    if (loading) return <Spinner message="Cargando producto..." />;
    if (error) return <div className="error-container" style={{ textAlign: 'center', padding: '5rem' }}><h1>Error: {error}</h1></div>;
    if (!product) return <div style={{ textAlign: 'center', padding: '5rem' }}><h1>Producto no encontrado.</h1></div>;

    const availableSizes = product.variantes ? product.variantes.map(v => v.tamanio) : [];
    const isOutOfStock = availableSizes.length === 0;
    
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price).replace("ARS", "$").trim();
    };

    return (
        <main>
            <div className="product-details-container-full">
                <div 
                  className="product-images-column" 
                  style={{ flexBasis: '45%', flexShrink: 0 }}
                >
                  <div style={{ maxWidth: '450px', margin: '0 auto' }}>
                    <div className="main-image-container" style={{ marginBottom: '1rem' }}>
                      <img 
                        src={transformCloudinaryUrl(mainImage, 600)} 
                        alt={product.nombre} 
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }} 
                      />
                    </div>
                    <div className="thumbnail-images-container" style={{ display: 'flex', gap: '0.75rem' }}>
                      {allImageUrls.map((url, index) => (
                        <div 
                          key={index} 
                          className="thumbnail-item" 
                          style={{ width: '80px', height: '100px', cursor: 'pointer', border: mainImage === url ? '2px solid black' : '2px solid transparent' }}
                          onClick={() => setMainImage(url)}
                        >
                          <img src={transformCloudinaryUrl(url, 150)} alt={`${product.nombre} - vista ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="product-info-panel-full"
                  style={{ flexBasis: '55%', paddingLeft: '3rem' }}
                >
                    <h1 className="product-name">{product.nombre}</h1>
                    <p className="product-style-info">SINGULARITY BLACK / GRAPHITE</p>
                    <p className="product-price">{formatPrice(product.precio)} ARS</p>
                    
                    <div className="product-size-selector">
                        <p className="size-label">SIZE: {selectedSize || 'NO DISPONIBLE'}</p>
                        <div className="size-buttons">
                            {availableSizes.map(size => (
                                <button
                                    key={size}
                                    className={`size-button ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="product-description-full">
                        <p>{product.descripcion || "Descripción no disponible."}</p>
                    </div>
                    
                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="add-to-cart-button"
                    >
                        {isOutOfStock ? 'SIN STOCK' : 'ADD TO BAG'}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ProductPage;
