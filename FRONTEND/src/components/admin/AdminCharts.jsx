import React from 'react';
import { Line, Bar } from 'react-chartjs-2'; // 1. Importar el gráfico de barras
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Importar el elemento de barra
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 2. Registrar el nuevo elemento
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// 3. Aceptar ambos conjuntos de datos como props
const AdminCharts = ({ salesData, expensesData }) => {

  // --- Gráfico de Ventas (sin cambios) ---
  const salesChart = salesData?.data.length > 0 ? (
    <div className="chart-widget">
      <h3>Evolución de Ventas</h3>
      <Line data={{
        labels: salesData.data.map(d => new Date(d.fecha).toLocaleDateString('es-AR')),
        datasets: [{
          label: 'Ventas por Día',
          data: salesData.data.map(d => d.total),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }]
      }} />
    </div>
  ) : null;

  // --- Gráfico de Gastos (nuevo) ---
  const expensesChart = expensesData?.data.length > 0 ? (
    <div className="chart-widget">
      <h3>Gastos por Categoría</h3>
      <Bar data={{
        labels: expensesData.data.map(d => d.categoria),
        datasets: [{
          label: 'Monto Gastado',
          data: expensesData.data.map(d => d.monto),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        }]
      }} 
      options={{ 
        indexAxis: 'y', // Opcional: hace el gráfico de barras horizontal
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      }}/>
    </div>
  ) : null;

  // Si no hay datos para ningún gráfico, mostrar un mensaje
  if (!salesChart && !expensesChart) {
    return <p>No hay datos suficientes para mostrar gráficos.</p>;
  }

  return (
    <div className="admin-charts-container">
      {salesChart}
      {expensesChart}
    </div>
  );
};

export default AdminCharts;
