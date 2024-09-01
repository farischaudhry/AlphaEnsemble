import React, { useState, useEffect } from 'react';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard({ onAgentSelect }) {
  const [leaderboard, setLeaderboard] = useState([
    { team: 'agent-001', pnl: 0, position: { 'Asset 1': 5.0, 'Asset 2': 5.0 } },
    { team: 'agent-002', pnl: 0, position: { 'Asset 1': 6.0, 'Asset 2': 4.0 } },
    { team: 'agent-003', pnl: 0, position: { 'Asset 1': 2.0, 'Asset 2': 8.0 } },
    { team: 'agent-004', pnl: 0, position: { 'Asset 1': 10.0, 'Asset 2': 0.0 } },
    { team: 'agent-005', pnl: 0, position: { 'Asset 1': 1.0, 'Asset 2': 9.0 } },
  ]);

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
              <td>{entry.pnl.toFixed(2)}</td>
              {/* <td>{entry.position}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
