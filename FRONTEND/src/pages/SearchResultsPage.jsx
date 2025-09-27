import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProducts } from '../api/productsApi'; // 1. Importar la API correcta
import Spinner from '../components/common/Spinner';

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');

    // 2. Usar useState y useEffect en lugar de react-query
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!query) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const fetchSearchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                // 3. Llamar a getProducts con el parámetro 'material'
                const data = await getProducts({ material: query, limit: 100 });
                setProducts(data);
            } catch (err) {
                setError('Error al buscar productos.');
            }
            setLoading(false);
        };

        fetchSearchResults();
    }, [query]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price).replace("ARS", "$").trim();
    };

    return (
        <main className="catalog-container">
            <div className="catalog-header">
                <h1 className="catalog-title">Resultados para: "{query}"</h1>
            </div>

            {loading && <Spinner message="Buscando..." />}
            {error && <p className="loading-text">{error}</p>}
            
            {!loading && !error && products?.length === 0 && (
                <p className="loading-text">No se encontraron productos para tu búsqueda.</p>
            )}

            {products && products.length > 0 && (
                <div className="catalog-product-grid">
                    {products.map(product => (
                        <Link to={`/product/${product.id}`} className="catalog-product-card" key={product.id}>
                            <div className="catalog-product-image-container">
                                <img 
                                    src={product.urls_imagenes?.[0] || '/img/placeholder.jpg'} 
                                    alt={product.nombre} 
                                    className="catalog-product-image"
                                />
                            </div>
                            <div className="catalog-product-info">
                                <h3 className="catalog-product-name">{product.nombre}</h3>
                                <p className="catalog-product-price">{formatPrice(product.precio)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
};

export default SearchResultsPage;
