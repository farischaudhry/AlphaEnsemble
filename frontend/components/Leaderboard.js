import React, { useState, useEffect } from 'react';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard({ onAgentSelect }) {
  const [leaderboard, setLeaderboard] = useState([]);

  const updateLeaderboard = (newEntry) => {
    setLeaderboard(prevLeaderboard => {
      const existingEntryIndex = prevLeaderboard.findIndex(entry => entry.team === newEntry.team);

      let updatedLeaderboard;

      if (existingEntryIndex !== -1) {
         // Update existing entry
        updatedLeaderboard = [...prevLeaderboard];
        updatedLeaderboard[existingEntryIndex] = { ...updatedLeaderboard[existingEntryIndex], ...newEntry };
      } else {
        // Add new entry
        updatedLeaderboard = [...prevLeaderboard, newEntry];
      }

      return updatedLeaderboard.sort((a, b) => b.pnl - a.pnl);
    });
  };

  useEffect(() => {
    async function startPolling() {
      // Ensure the contract is initialized
      await initializeContract();

      // Start polling after initialization
      const intervalId = setInterval(() => {
        pollEvents(() => {}, updateLeaderboard);
      }, 15000);

      return () => clearInterval(intervalId);  // Cleanup the interval on component unmount
    }

    startPolling();
  }, []);

  const handleRowClick = (agentId) => {
    if (onAgentSelect) {
      onAgentSelect(agentId);
    }
  };

  return (
    <div className={styles.leaderboard}>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Teams</th>
            <th>PnL</th>
            {/* <th>Position</th> */}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index} onClick={() => handleRowClick(entry.team)}>
              <td>{index + 1}</td>
              <td>{entry.team}</td>
              <td>{(entry.pnl ?? 0).toFixed(2)}</td>
              {/* <td>{entry.position}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
