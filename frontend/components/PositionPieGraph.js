import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import styles from '../styles/PositionPieGraph.module.css';
import 'chart.js/auto';

const PositionPieGraph = ({ agentId }) => {
  if (!agentId) {
    return <p>No agents selected. Please select agents to view the portfolio allocations.</p>;
  }

  const [positionData, setPositionData] = useState({
    'agent-001': {
      'ETH': 0.5,
      'BTC': 0.3,
      'LINK': 0.2,
    },
    'agent-002': {
      'ETH': 0.3,
      'BTC': 0.4,
      'LINK': 0.3,
    },
    'agent-003': {
      'ETH': 0.2,
      'BTC': 0.5,
      'LINK': 0.3,
    },
  });

  // const updatePositionData = (newEntry) => {
  //   setPositionData(prevPositionData => {
  //     const existingEntryIndex = prevPositionData.findIndex(entry => entry.team === newEntry.team);

  //     let updatedPositionData;

  //     if (existingEntryIndex !== -1) {
  //        // Update existing entry
  //       updatedPositionData = [...prevPositionData];
  //       updatedPositionData[existingEntryIndex] = { ...updatedPositionData[existingEntryIndex], ...newEntry };
  //     } else {
  //       // Add new entry
  //       updatedPositionData = [...prevLeaderboard, newEntry];
  //     }
  //     return updatedPositionData;
  //   });
  // };

  const updatePositionData = (newEntry) => {
    setPositionData(prevPositionData => {
      const updatedPositionData = { ...prevPositionData };
  
      // Set the positions field for the corresponding team
      updatedPositionData[newEntry.team] = newEntry.positions;
  
      return updatedPositionData;
    });
  };

  const shownPositionData = positionData[agentId] || {};

  const data = {
    labels: Object.keys(shownPositionData),
    datasets: [
      {
        label: 'Portfolio Allocation',
        data: Object.values(shownPositionData),
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
    maintainAspectRatio: false,
  };


  return (
    <div>
      <h2>Portfolio Allocation for {agentId} </h2>
      <div>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default PositionPieGraph;
