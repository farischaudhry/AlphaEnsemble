import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import styles from '../styles/PositionPieGraph.module.css';

const PositionPieGraph = ({ agentId, positionData }) => {
  if (!agentId) {
    return <p>No agents selected. Please select an agent to view the portfolio allocations.</p>;
  }

  const shownPositionData = positionData[agentId] || {};

  // If there are no positions for the selected agent, show a message instead of rendering the chart.
  const hasPositionData = Object.keys(shownPositionData).length > 0;

  if (!hasPositionData) {
    return <p>No positions available for this agent.</p>;
  }

  const data = {
    labels: Object.keys(shownPositionData),
    datasets: [
      {
        label: 'Portfolio Allocation',
        data: Object.values(shownPositionData).map(value => Number(value)), // Convert BigInt to Number
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ensure the chart does not distort its parent container
    plugins: {
      legend: {
        position: 'bottom', // Adjust position of the legend
        labels: {
          color: '#e1e4e8', // Ensure the legend labels are visible
        },
      },
    },
  };

  return (
    <div className={styles['pie-chart-container']}>
      <h2 className={styles['pie-chart-title']}>Portfolio Allocation for {agentId}</h2>
      <div className={styles['pie-chart-canvas']}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default PositionPieGraph;
