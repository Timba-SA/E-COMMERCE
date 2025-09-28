import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DropdownMenu = ({ isOpen, onClose, logoPosition }) => {
  const [activeCategory, setActiveCategory] = useState('menswear');
  
  const location = useLocation();
  const currentSubCategory = location.pathname.split('/')[2] || '';

  const handleLinkClick = () => {
    onClose();
  };

  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    setActiveCategory(category);
  };

  // Para evitar errores si al principio las coordenadas no existen
  const effectiveLogoPosition = logoPosition || { top: 0, left: 0, width: 0, height: 0 };

  // Los estilos en línea que hacen la magia de alineación
  const logoStyle = {
    position: 'fixed',
    top: `${effectiveLogoPosition.top}px`,
    left: `${effectiveLogoPosition.left}px`,
    width: `${effectiveLogoPosition.width}px`,
    height: `${effectiveLogoPosition.height}px`,
    color: '#000', // Color negro sobre fondo blanco
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2003,
    opacity: isOpen ? 1 : 0, // Aparece y desaparece con el menú
    transition: 'opacity 0.2s ease-in-out',
    pointerEvents: 'none', // Para que no interfiera con los clics
  };

  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <aside className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        <div className="dropdown-header">
          <button className={`close-btn ${isOpen ? 'open' : ''}`} aria-label="Cerrar menú" onClick={onClose}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        {/* El logo "fantasma" que se alinea perfectamente */}
        <div className="logo" style={logoStyle}>VOID</div>

        <div className="dropdown-content">
          <div className="menu-categories">
            <nav className="dropdown-nav-left">
              <ul>
                <li>
                  <Link 
                    to="/catalog/womenswear" 
                    onClick={(e) => handleCategoryClick(e, 'womenswear')} 
                    className={`category-link ${activeCategory === 'womenswear' ? 'active-category' : ''}`}
                  >
                    WOMENSWEAR
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/catalog/menswear" 
                    onClick={(e) => handleCategoryClick(e, 'menswear')} 
                    className={`category-link ${activeCategory === 'menswear' ? 'active-category' : ''}`}
                  >
                    MENSWEAR
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="dropdown-nav-right">
              <ul className={`submenu ${activeCategory === 'womenswear' ? 'active-submenu' : ''}`}>
                <li><Link to="/catalog/dresses" onClick={handleLinkClick} className={currentSubCategory === 'dresses' ? 'active-category' : ''}>DRESSES</Link></li>
                <li><Link to="/catalog/tops" onClick={handleLinkClick} className={currentSubCategory === 'tops' ? 'active-category' : ''}>TOPS</Link></li>
              </ul>
              <ul className={`submenu ${activeCategory === 'menswear' ? 'active-submenu' : ''}`}>
                <li><Link to="/catalog/hoodies" onClick={handleLinkClick} className={currentSubCategory === 'hoodies' ? 'active-category' : ''}>HOODIES</Link></li>
                <li><Link to="/catalog/jackets" onClick={handleLinkClick} className={currentSubCategory === 'jackets' ? 'active-category' : ''}>JACKETS</Link></li>
                <li><Link to="/catalog/shirts" onClick={handleLinkClick} className={currentSubCategory === 'shirts' ? 'active-category' : ''}>SHIRTS</Link></li>
                <li><Link to="/catalog/pants" onClick={handleLinkClick} className={currentSubCategory === 'pants' ? 'active-category' : ''}>PANTS</Link></li>
              </ul>
            </nav>
          </div>

          <div className="dropdown-footer">
            <div className="footer-images">
              <div className="footer-image left"><img src="/img/dropdownIzquierda.jpg" alt="Carretera" /></div>
              <div className="footer-image right"><img src="/img/dropdownDerecha.jpg" alt="Autopista" /></div>
            </div>
            <h3 className="footer-text">FIND YOUR OWN ROAD</h3>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DropdownMenu;