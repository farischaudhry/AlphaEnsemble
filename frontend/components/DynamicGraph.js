import React, { useState } from 'react';
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

function DynamicGraph({ selectedAgents }) {
  if (!selectedAgents || selectedAgents.length === 0) {
    return <p>No agents selected. Please select agents to view the graph.</p>;
  }

  const [allAgentData, setAllAgentData] = useState({
      'agent-001': {
        data: [19000, 19500, 20000, 20000, 20000, 20000],
        color: '#FF5733', // Assign a predefined color
      },
      'agent-002': {
        data: [0, 0, 0, 0, 0, 0],
        color: '#33FF57', // Assign a predefined color
      },
      'agent-003': {
        data: [15000, 15500, 16000, 16500, 17000, 17500],
        color: '#3357FF', // Assign a predefined color
      },
    }
  );

  const updateAgentData = (newEntry) => {
    setAllAgentData(prevAllAgentData => {
      const { team, pnl } = newEntry;

      // Check if the agent already exists in the state
      const agentExists = prevAllAgentData[team] !== undefined;

      // Create a new data array for the updated agent
      let updatedDataArray;

      if (agentExists) {
        // If the agent exists, get the existing data and append the new pnl value
        const existingDataArray = prevAllAgentData[team].data;
        updatedDataArray = [...existingDataArray, pnl];

        // Keep only the most recent 10 entries
        if (updatedDataArray.length > 10) {
          updatedDataArray = updatedDataArray.slice(-10);
        }
      } else {
        updatedDataArray = [pnl];
      }

      // Update the agent data in the state
      return {
        ...prevAllAgentData,
        [team]: {
          ...prevAllAgentData[team],
          data: updatedDataArray,
        },
      };
    });
  };

  const datasets = selectedAgents.map((agentId, index) => {
    const agentInfo = allAgentData[agentId] || {};
    const agentData = agentInfo.data || [];
    const agentColor = agentInfo.color || getColor(index); // Use predefined color or get one based on index
  
    return {
      label: `PnL for ${agentId}`,
      data: agentData,
      fill: false,
      borderColor: agentColor, // Use the assigned color for each agent
      tension: 0.1,
    };
  });
  

  const data = {
    labels: [':20', ':25', ':30', ':35', ':40', ':45'], // Example time labels
    datasets: datasets,
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
      <h2 className={styles.graphTitle}>Performance for Selected Agents</h2>
      <div className={styles.graphCanvas}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

function getColor(index) {
  const predefinedColors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1',
    '#A133FF', '#33FFA1', '#FF8C33', '#33A1FF'
  ];

  return index < predefinedColors.length ? predefinedColors[index] : getRandomColor();
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}



export default DynamicGraph;
