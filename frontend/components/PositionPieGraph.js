import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

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
        data: Object.values(shownPositionData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div>
      <h2>Portfolio Allocation for {agentId}</h2>
      <Pie data={data} options={options} />
    </div>
  );
};

export default PositionPieGraph;
