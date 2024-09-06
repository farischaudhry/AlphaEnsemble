import React from 'react';
import { Line } from 'react-chartjs-2';
import styles from '../styles/DynamicGraph.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function DynamicGraph({ selectedAgents, pnlData, timestamps }) {
  if (!selectedAgents || selectedAgents.length === 0) {
    return <p>No agents selected. Please select agents to view the graph.</p>;
  }

  const datasets = selectedAgents.map((agentId, index) => {
    const agentInfo = pnlData[agentId] || {};
    const agentData = agentInfo.data || [];
    const agentColor = agentInfo.color || getColor(index);

    return {
      label: `PnL for ${agentId}`,
      data: agentData,
      fill: false,
      borderColor: agentColor,
      tension: 0.1,
    };
  });

  const data = {
    labels: timestamps,  // Use the passed timestamps for the x-axis
    datasets: datasets,
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        grid: { color: '#505050' },
        ticks: { color: '#c7c7e2' },
        title: { display: true, text: 'Time', color: '#c7c7e2' },
      },
      y: {
        grid: { color: '#505050' },
        ticks: { color: '#c7c7e2' },
        title: { display: true, text: 'Total PnL', color: '#c7c7e2' },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#c7c7e2' },
      },
    },
  };

  return (
    <div className="graph-container">
      <h2>Performance for Selected Agents</h2>
      <Line data={data} options={options} />
    </div>
  );
}

function getColor(index) {
  const predefinedColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FF8C33', '#33A1FF'];
  return predefinedColors[index % predefinedColors.length];
}

export default DynamicGraph;
