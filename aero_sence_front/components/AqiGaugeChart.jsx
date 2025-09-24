// aero_sence_front/components/AqiGaugeChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AqiGaugeChart = ({ value }) => {
  const data = [
    { name: 'AQI', value: value },
    { name: 'Restante', value: 200 - value }, // Assumindo uma escala máxima de 200 para AQI
  ];

  const getColor = (aqi) => {
    if (aqi <= 50) return '#28a745'; // Verde (Bom)
    if (aqi <= 100) return '#ffc107'; // Amarelo (Moderado)
    if (aqi <= 150) return '#dc3545'; // Vermelho (Insalubre)
    return '#343a40'; // Cinza Escuro (Muito Insalubre/Perigoso)
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
          >
            <Cell fill={getColor(value)} />
            <Cell fill="#e9ecef" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: getColor(value) }}>{value}</span>
        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>AQI</div>
      </div>
    </div>
  );
};

export default AqiGaugeChart;