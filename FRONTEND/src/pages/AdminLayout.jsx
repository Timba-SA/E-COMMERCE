// En FRONTEND/src/pages/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const AdminLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ¡ACÁ ESTÁ EL CAMBIO!
  // Envolvemos todo en un <main> con estilos para que ocupe todo el alto disponible.
  // Y el contenido de la derecha ahora es un <section> para que el HTML sea correcto.
  return (
    <main style={{ display: 'flex', flexGrow: 1 }}>
      <div className="admin-dashboard-container">
        <aside className="admin-sidebar">
          <nav>
            {/* Usamos NavLink para que se marque la opción activa */}
            <NavLink to="/admin" end className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>Dashboard</NavLink>
            <NavLink to="/admin/products" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>Products</NavLink>
            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>Orders</NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>Users</NavLink>
          </nav>
          <button onClick={handleLogout} className="account-logout-btn">
            LOGOUT
          </button>
        </aside>
        
        <section className="admin-content">
          <Outlet />
        </section>
      </div>
    </main>
  );
};

export default AdminLayout;