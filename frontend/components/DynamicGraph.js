import React from 'react';
import { Line } from 'react-chartjs-2';
import styles from '../styles/DynamicGraph.module.css';
import {
  Chart as ChartJS,
  CategoryScale, // Register the category scale
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function DynamicGraph({ agentId }) {
  if (!agentId) {
    return <p>Select an agent to view the graph.</p>;
  }

  const allAgentData = {
    'team-001': [19000, 19500, 20000, 20000, 20000, 20000],
    'team-002': [0, 0, 0, 0, 0, 0],
    'team-003': [15000, 15500, 16000, 16500, 17000, 17500],
    // Add more agents and their data here
  };
  const agentData = allAgentData[agentId];

  const data = {
    labels: [':20', ':25', ':30', ':35', ':40', ':45'], // Example time labels
    datasets: [
      // {
      //   label: 'team-001',
      //   data: [19000, 19500, 20000, 20000, 20000, 20000], // Example data points for team-001
      //   fill: false,
      //   borderColor: '#4f98ca', // Light blue color
      //   tension: 0.1,
      // },
      // {
      //   label: 'team-002',
      //   data: [0, 0, 0, 0, 0, 0], // Example data points for team-002
      //   fill: false,
      //   borderColor: '#e64a19', // Red color
      //   tension: 0.1,
      // },
      {
        label: `PnL for ${agentId}`,
        data: agentData, // Data points for the specific agent
        fill: false,
        borderColor: '#4f98ca', // Customize color as needed
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        grid: {
          color: '#505050', // Darker grid line color
        },
        ticks: {
          color: '#c7c7e2', // Light tick color
        },
        title: {
          display: true,
          text: 'Time',
          color: '#c7c7e2', // Title color
        },
      },
      y: {
        grid: {
          color: '#505050', // Darker grid line color
        },
        ticks: {
          color: '#c7c7e2', // Light tick color
        },
        title: {
          display: true,
          text: 'Total PnL',
          color: '#c7c7e2', // Title color
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#c7c7e2', // Legend color
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#333',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className={styles.graphContainer}>
      <h2 className={styles.graphTitle}>Performance for Agent {agentId}</h2>
      <div className={styles.graphCanvas}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default DynamicGraph;
