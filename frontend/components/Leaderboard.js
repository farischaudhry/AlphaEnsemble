import React, { useState, useEffect } from 'react';
import { listenToEvents } from '../contracts/contractInteraction';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard({ onAgentSelect }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    listenToEvents(() => {}, updateLeaderboard);

    // Cleanup listener when component unmounts
    return () => {
      // Optionally remove listeners here
    };
  }, []);

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

      // Sort leaderboard by PnL in descending order
      return updatedLeaderboard.sort((a, b) => b.pnl - a.pnl);
    });
  };

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
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index} onClick={() => handleRowClick(entry.team)}>
              <td>{index + 1}</td>
              <td>{entry.team}</td>
              <td>{entry.pnl.toFixed(2)}</td>
              <td>{entry.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
