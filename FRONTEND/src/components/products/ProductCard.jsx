import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  // Asegurarse de que el producto y sus propiedades necesarias existan
  if (!product || !product.id) {
    return null; // O mostrar un placeholder/error
  }

  // El backend devuelve un array de URLs, usamos la primera como imagen principal.
  const imageUrl = product.urls_imagenes && product.urls_imagenes.length > 0
    ? product.urls_imagenes[0]
    : 'https://via.placeholder.com/300x400'; // Una imagen por defecto

  return (
    <div className="catalog-product-card product-card">
      <Link to={`/product/${product.id}`} className="catalog-product-link">
        <div className="catalog-product-image-container">
          <img src={imageUrl} alt={product.nombre} className="catalog-product-image" />
        </div>
        <div className="catalog-product-info">
          <h3 className="catalog-product-name">{product.nombre}</h3>
          <p className="catalog-product-price">${product.precio.toFixed(2)}</p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
