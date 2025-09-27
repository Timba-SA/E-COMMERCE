import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore'; // 1. Importar el store de Zustand
import { getMyOrdersAPI } from '../api/ordersApi'; // 2. Importar la nueva API de órdenes
import Spinner from '../components/common/Spinner';

const AccountPage = () => {
  // 3. Usar el store para obtener la información del usuario y el logout
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      // El token ya no es necesario aquí, la API se encarga
      try {
        // 4. Llamar a la función de API correcta
        const data = await getMyOrdersAPI();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []); // El efecto se ejecuta solo una vez

  return (
    <div className="account-page-container">
      <h1>Mi Cuenta</h1>
      <div className="account-content">
        <aside className="account-sidebar">
          <h3>Hola, {user?.name}</h3>
          <p>{user?.email}</p>
          {/* La función de logout viene directamente del store */}
          <button onClick={logout} className="logout-button">Cerrar Sesión</button>
        </aside>
        <main className="account-main">
          <h2>Mi Historial de Compras</h2>
          {loading ? <Spinner message="Cargando historial..." /> : (
            orders.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{new Date(order.creado_en).toLocaleDateString()}</td>
                      <td>${order.monto_total}</td>
                      <td>{order.estado_pago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>Todavía no hiciste ninguna compra. ¿Qué estás esperando?</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default AccountPage;
