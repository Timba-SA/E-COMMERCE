import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const FilterPanel = ({ isOpen, onClose, onFilterChange, initialFilters }) => {
  const [priceRange, setPriceRange] = useState([0, initialFilters.precio_max]);
  const [selectedSizes, setSelectedSizes] = useState(initialFilters.talle || []);

  const minPrice = 0;
  const maxPrice = 200000;

  useEffect(() => {
    setPriceRange([0, initialFilters.precio_max]);
    setSelectedSizes(initialFilters.talle || []);
  }, [initialFilters]);

  const handlePriceChange = (newRange) => {
    setPriceRange(newRange);
  };

  const handleApplyPriceFilter = (newRange) => {
    onFilterChange({ precio_max: newRange[1] });
  };

  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    const newSizes = checked 
      ? [...selectedSizes, value] 
      : selectedSizes.filter(size => size !== value);
    
    setSelectedSizes(newSizes);
    onFilterChange({ talle: newSizes });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace("ARS", "").trim();
  };

  return (
    <div className={`filter-panel ${isOpen ? 'open' : ''}`}>
      <div className="filter-panel-header">
        <h2 className="filter-panel-title">FILTROS</h2>
        <button className="filter-panel-close-btn" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="filter-panel-content">
        {/* --- ESTRUCTURA RESTAURADA --- */}
        {/* Gender Filter (Estático) */}
        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-section-title">GENDER</span>
            <span className="filter-section-arrow">&gt;</span>
          </div>
        </div>

        {/* Category Filter (Estático) */}
        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-section-title">CATEGORY</span>
            <span className="filter-section-arrow">&gt;</span>
          </div>
        </div>

        {/* Size Filter (Dinámico) */}
        <div className="filter-section active">
          <div className="filter-section-header">
            <span className="filter-section-title">SIZE</span>
            <span className="filter-section-arrow">&#8964;</span>
          </div>
          <div className="filter-section-body">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <label className="checkbox-container" key={size}>
                <input 
                  type="checkbox" 
                  name="size" 
                  value={size} 
                  checked={selectedSizes.includes(size)}
                  onChange={handleSizeChange}
                /> {size}
                <span className="checkmark"></span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter (Dinámico) */}
        <div className="filter-section active">
          <div className="filter-section-header">
            <span className="filter-section-title">PRICE</span>
          </div>
          <div className="filter-section-body price-filter-body">
            <div className="price-display">
              <span className="price-value">{formatPrice(priceRange[0])} ARS</span>
              <span className="price-separator">-</span>
              <span className="price-value">{formatPrice(priceRange[1])} ARS</span>
            </div>
            <Slider
              range
              min={minPrice}
              max={maxPrice}
              step={1000}
              value={priceRange}
              onChange={handlePriceChange}
              onChangeComplete={handleApplyPriceFilter}
              trackStyle={[{ backgroundColor: 'black', height: 2 }]}
              handleStyle={[{ backgroundColor: 'black', borderColor: 'black', height: 10, width: 10, marginTop: -4, boxShadow: 'none' }, { backgroundColor: 'black', borderColor: 'black', height: 10, width: 10, marginTop: -4, boxShadow: 'none'}]}
              railStyle={{ backgroundColor: '#ccc', height: 2 }}
            />
          </div>
        </div>

        {/* Color Filter (Estático) */}
        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-section-title">COLOR</span>
            <span className="filter-section-arrow">&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;