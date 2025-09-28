import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const DropdownMenu = ({ isOpen, onClose, logoPosition }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentCategory = location.pathname.split('/')[2] || '';
  const [activeCategory, setActiveCategory] = useState('menswear');

  useEffect(() => {
    if (isOpen) {
      const pathSegments = location.pathname.split('/');
      const category = pathSegments[1];
      const subCategory = pathSegments[2];

      if (category === 'catalog') {
        if (['dresses', 'tops', 'skirts', 'jeans', 'womenswear'].includes(subCategory)) {
          setActiveCategory('womenswear');
        } else if (['hoodies', 'jackets', 'shirts', 'pants', 'menswear'].includes(subCategory)) {
          setActiveCategory('menswear');
        }
      } else {
        setActiveCategory('menswear');
      }
    }
  }, [isOpen, location.pathname]);

  // 1. Función para navegar a una ruta y cerrar el menú (usada por los links finales)
  const handleNavigateAndClose = (path) => {
    navigate(path);
    onClose();
  };

  // 2. Función para manejar el click en las categorías principales (el toggle)
  const handleMainCategoryClick = (category, path) => {
    if (activeCategory === category) {
      // Si ya está activo: Navega a la ruta principal del catálogo y cierra.
      handleNavigateAndClose(path);
    } else {
      // Si no está activo: Solo cambia la categoría para mostrar el submenú.
      setActiveCategory(category);
    }
  };

  // 3. Función para cerrar el menú cuando se hace click en el logo o en un sub-link
  const handleLinkClick = () => {
    onClose();
  };

  const categories = {
    womenswear: [
      { name: 'DRESSES', path: '/catalog/dresses' },
      { name: 'TOPS', path: '/catalog/tops' },
      { name: 'SKIRTS', path: '/catalog/skirts' },
      { name: 'JEANS', path: '/catalog/jeans' },
    ],
    menswear: [
      { name: 'HOODIES', path: '/catalog/hoodies' },
      { name: 'JACKETS', path: '/catalog/jackets' },
      { name: 'SHIRTS', path: '/catalog/shirts' },
      { name: 'PANTS', path: '/catalog/pants' },
    ],
  };

  const phantomLogoStyle = logoPosition
    ? {
        position: 'fixed',
        top: `${logoPosition.top}px`,
        left: `${logoPosition.left}px`,
        width: `${logoPosition.width}px`,
        height: `${logoPosition.height}px`,
        color: 'var(--text-color)',
        zIndex: 2003,
        pointerEvents: 'none',
      }
    : {};

  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <aside className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        {isOpen && logoPosition && (
          <div className="logo" style={phantomLogoStyle}>
            VOID
          </div>
        )}

        <div className="dropdown-header">
          <button
            className={`close-btn ${isOpen ? 'open' : ''}`}
            aria-label="Cerrar menú"
            aria-expanded={isOpen}
            onClick={onClose}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <Link to="/" className="logo dropdown-logo" onClick={handleLinkClick} style={{ visibility: 'hidden' }}>
              VOID
          </Link>
        </div>

        <div className="dropdown-content">
          <div className="menu-categories">
            <nav className="dropdown-nav-left">
              <ul>
                <li>
                  <div 
                    onClick={() => handleMainCategoryClick('womenswear', '/catalog/womenswear')} 
                    className={`category-link ${activeCategory === 'womenswear' ? 'active-category' : ''}`}
                  >
                    WOMENSWEAR
                  </div>
                </li>
                <li>
                  <div 
                    onClick={() => handleMainCategoryClick('menswear', '/catalog/menswear')} 
                    className={`category-link ${activeCategory === 'menswear' ? 'active-category' : ''}`}
                  >
                    MENSWEAR
                  </div>
                </li>
              </ul>
            </nav>
            <nav className="dropdown-nav-right">
              <ul className="submenu active-submenu">
                
                {/* Agregamos el link para ver todos los productos de la categoría activa */}
                <li key={`all-${activeCategory}`}>
                    <Link
                        to={`/catalog/${activeCategory}`}
                        onClick={() => handleNavigateAndClose(`/catalog/${activeCategory}`)} 
                        className="view-all-link"
                    >
                        VIEW ALL {activeCategory.toUpperCase()}
                    </Link>
                </li>
                
                {/* Mapeamos las subcategorías */}
                {categories[activeCategory] && categories[activeCategory].map(subcategory => (
                  <li key={subcategory.name}>
                    <Link 
                      to={subcategory.path} 
                      onClick={handleLinkClick} 
                      className={currentCategory === subcategory.path.split('/')[2] ? 'active-category' : ''}
                    >
                      {subcategory.name}
                    </Link>
                  </li>
                ))}
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