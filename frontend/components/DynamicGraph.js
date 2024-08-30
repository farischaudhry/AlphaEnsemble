import React from 'react';
import { Line } from 'react-chartjs-2';
import styles from '../styles/DynamicGraph.module.css';

function DynamicGraph({ agentId }) {
  if (!agentId) {
    return <p>Select an agent to view the graph.</p>;
  }

  const data = {
    labels: ['Time1', 'Time2', 'Time3'], // TODO: Add dynamic time labels
    datasets: [
      {
        label: `PnL Over Time for ${agentId}`,
        data: [10, 20, 30], // TODO: Replace with dynamic PnL data
        fill: false,
        backgroundColor: '#f97316',
        borderColor: '#f97316',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        grid: {
          color: '#c7c7e2',
        },
        ticks: {
          color: '#c7c7e2',
        },
      },
      y: {
        grid: {
          color: '#c7c7e2',
        },
        ticks: {
          color: '#c7c7e2',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#c7c7e2',
        },
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
