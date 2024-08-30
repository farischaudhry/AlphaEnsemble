import React from 'react';
import { Line } from 'react-chartjs-2';

function DynamicGraph({ agentId }) {
  if (!agentId) {
    return <p>Select an agent to view the graph.</p>;
  }

  const data = {
    labels: ['Time1', 'Time2', 'Time3'],
    datasets: [
      {
        label: `PnL Over Time for ${agentId}`,
        data: [0 /* Add PnL data here */],
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
          color: '#c7c7e2'
        }
      },
      y: {
        grid: {
          color: '#c7c7e2'
        }
      }
    }
  };

  return (
    <div className="dynamic-graph">
      <Line data={data} options={options} />
    </div>
  );
}

export default DynamicGraph;
