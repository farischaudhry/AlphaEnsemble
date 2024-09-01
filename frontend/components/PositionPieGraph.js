import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import styles from '../styles/PositionPieGraph.module.css';
import 'chart.js/auto';

const PositionPieGraph = ({ agentId }) => {
  const [positionData, setPositionData] = useState({});

  useEffect(() => {
    if (!agentId) return;

    async function fetchPositionData() {
      const position = await getPositionDataForAgent(agentId);
      setPositionData(position);
    }

    fetchPositionData();
  }, [agentId]);

  const getPositionDataForAgent = async (agentId) => {
    const mockData = {
      'Asset 1': 30.0,
      'Asset 2': 20.0,
      'Outstanding Funds': 50.0,
    };

    return mockData;
  };

  const data = {
    labels: Object.keys(positionData),
    datasets: [
      {
        label: 'Portfolio Allocation',
        data: Object.values(positionData),
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
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default PositionPieGraph;
