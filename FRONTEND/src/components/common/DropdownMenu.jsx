import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// 1. Recibimos la nueva prop 'logoPosition'
const DropdownMenu = ({ isOpen, onClose, logoPosition }) => {
  const location = useLocation();
  const currentSubCategory = location.pathname.split('/')[2] || '';

  const handleLinkClick = () => {
    onClose();
  };

  // 2. Creamos el estilo para el logo "fantasma" que se va a alinear.
  // Solo lo hacemos si tenemos la posición, si no, es un objeto vacío.
  const phantomLogoStyle = logoPosition
    ? {
        position: 'fixed', // Posición fija para que no se mueva con el scroll
        top: `${logoPosition.top}px`,
        left: `${logoPosition.left}px`,
        width: `${logoPosition.width}px`,
        height: `${logoPosition.height}px`,
        color: 'var(--text-color)', // Para que se vea sobre el fondo blanco
        zIndex: 2003, // Por encima del menú pero debajo de la X para cerrar
        pointerEvents: 'none', // Para que no se pueda hacer click en él
      }
    : {};

  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <aside className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        {/* --- ¡ACÁ VA EL LOGO FANTASMA! --- */}
        {/* 3. Renderizamos el logo fantasma SOLO si el menú está abierto y tenemos la posición */}
        {isOpen && logoPosition && (
          <div className="logo" style={phantomLogoStyle}>
            VOID
          </div>
        )}

        <div className="dropdown-header">
          <button
            className={`close-btn ${isOpen ? 'open' : ''}`}
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {/* Este es el logo que se queda en su lugar normal, pero lo hacemos invisible */}
          <Link to="/" className="logo dropdown-logo" onClick={handleLinkClick} style={{ visibility: 'hidden' }}>
              VOID
          </Link>
        </div>

        <div className="dropdown-content">
          <div className="menu-categories">
            <nav className="dropdown-nav-left">
              <ul>
                <li><Link to="/catalog/womenswear" onClick={handleLinkClick} className="category-link">WOMENSWEAR</Link></li>
                <li><Link to="/catalog/menswear" onClick={handleLinkClick} className="category-link active-category">MENSWEAR</Link></li>
              </ul>
            </nav>
            <nav className="dropdown-nav-right">
              <ul className="submenu active-submenu">
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