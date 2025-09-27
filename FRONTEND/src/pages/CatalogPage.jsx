import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProducts } from '../api/productsApi'; // 1. Importar la API de productos
import FilterPanel from '@/components/common/FilterPanel.jsx';
import Spinner from '@/components/common/Spinner.jsx';

// --- Componentes Internos ---
const ProductCard = ({ product }) => {
    const imageUrl = product.urls_imagenes?.[0] || '/img/placeholder.jpg';
    const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price).replace("ARS", "$").trim();

    return (
        <div className="catalog-product-card">
            <Link to={`/product/${product.id}`} className="catalog-product-link">
                <div className="catalog-product-image-container">
                    <img src={imageUrl} alt={product.nombre} className="catalog-product-image"/>
                </div>
                <div className="catalog-product-info">
                    <h3 className="catalog-product-name">{product.nombre}</h3>
                    <p className="catalog-product-price">{formatPrice(product.precio)}</p>
                </div>
            </Link>
        </div>
    );
};

const ProductCardSkeleton = () => (
    <div className="catalog-product-card">
        <div className="catalog-product-image-container bg-gray-200 animate-pulse" style={{ backgroundColor: '#f0f0f0' }} />
        <div className="catalog-product-info mt-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" style={{ height: '1rem', backgroundColor: '#e0e0e0' }} />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" style={{ height: '1rem', backgroundColor: '#e0e0e0' }} />
        </div>
    </div>
);

// --- Página Principal del Catálogo ---
const CatalogPage = () => {
    const { categoryName } = useParams();
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Estado centralizado para filtros y paginación
    const [filters, setFilters] = useState({
        talle: [],
        precio_max: 200000,
        sort_by: 'nombre_asc',
        skip: 0,
        limit: 12,
    });

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = { ...filters };
            if (categoryName) params.categoria = categoryName;
            if (params.talle.length === 0) delete params.talle; // No enviar talle si está vacío
            else params.talle = params.talle.join(','); // Convertir array a string separado por comas

            const data = await getProducts(params);
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'No se pudieron cargar los productos');
        } finally {
            setIsLoading(false);
        }
    }, [categoryName, filters]);

    // 3. useEffect que reacciona a los cambios en los filtros
    useEffect(() => {
        fetchProducts();
        window.scrollTo(0, 0);
    }, [fetchProducts]);

    useEffect(() => {
        document.body.style.overflow = isFilterPanelOpen ? 'hidden' : 'auto';
    }, [isFilterPanelOpen]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters, skip: 0 })); // Resetea la paginación al cambiar filtros
    };
    
    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sort_by: e.target.value, skip: 0 }));
    };

    const toggleFilterPanel = () => setIsFilterPanelOpen(!isFilterPanelOpen);

    return (
        <>
            <main className="catalog-container">
                <div className="catalog-header">
                    <h1 className="catalog-title">{categoryName?.replace('-', ' ') || 'CATÁLOGO'}</h1>
                    <div className="catalog-controls">
                        <select onChange={handleSortChange} value={filters.sort_by} className="sort-dropdown">
                            <option value="nombre_asc">Ordenar por: Nombre (A-Z)</option>
                            <option value="nombre_desc">Ordenar por: Nombre (Z-A)</option>
                            <option value="precio_asc">Ordenar por: Precio (Menor a Mayor)</option>
                            <option value="precio_desc">Ordenar por: Precio (Mayor a Menor)</option>
                        </select>
                        <button onClick={toggleFilterPanel} className="filters-link">FILTROS &gt;</button>
                    </div>
                </div>

                {isLoading ? (
                  <div className="catalog-product-grid">
                      {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                  </div>
                ) : error ? (
                  <p className="loading-text">{error}</p>
                ) : products.length > 0 ? (
                  <div className="catalog-product-grid">
                      {products.map(product => <ProductCard product={product} key={product.id} />)}
                  </div>
                ) : (
                    <p className="loading-text">No se encontraron productos con estos filtros.</p>
                )}

                {/* Aquí iría la paginación */}
            </main>
            
            <div className={`filter-panel-overlay ${isFilterPanelOpen ? 'open' : ''}`} onClick={toggleFilterPanel} />
            {/* 4. Pasar estado y manejadores al panel de filtros */}
            <FilterPanel 
                isOpen={isFilterPanelOpen} 
                onClose={toggleFilterPanel} 
                onFilterChange={handleFilterChange}
                initialFilters={filters}
            />
        </>
    );
};

export default CatalogPage;
