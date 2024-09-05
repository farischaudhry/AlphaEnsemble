import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import styles from '../styles/PositionPieGraph.module.css';
import 'chart.js/auto';

const PositionPieGraph = ({ agentId }) => {
  const [positionData, setPositionData] = useState({});

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
    <div className={styles.pieChartContainer}>
      <h3>Portfolio Allocation</h3>
      <div className={styles.pieChartCanvas}>
        <Pie data={shownPositionData} options={options} />
      </div>
    </div>
  );
};

export default PositionPieGraph;
