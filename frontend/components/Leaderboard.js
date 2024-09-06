import React, { useState, useEffect, useRef } from 'react';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard({ onAgentSelect }) {
  const [leaderboard, setLeaderboard] = useState([
    { team: 'agent-001', pnl: 3000 },
    { team: 'agent-002', pnl: 2000 },
    { team: 'agent-003', pnl: 1000 },
  ]);

  const prevLeaderboardRef = useRef(leaderboard);

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

  useEffect(() => {
    // Update the ref with the latest leaderboard
    prevLeaderboardRef.current = leaderboard;
  }, [leaderboard]);

  const handleRowClick = (agentId) => {
    if (onAgentSelect) {
      onAgentSelect(agentId);
    }
  };

  const getPnlStyle = (team, pnl) => {
    const prevLeaderboard = prevLeaderboardRef.current;
    const prevEntry = prevLeaderboard.find(entry => entry.team === team);
    if (prevEntry) {
      if (pnl > prevEntry.pnl) {
        return { color: 'green' };
      } else if (pnl < prevEntry.pnl) {
        return { color: 'red' };
      } 
    }
    return {}; 
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Teams</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index} onClick={() => handleRowClick(entry.team)}>
              <td>{index + 1}</td>
              <td>{entry.team}</td>
              <td style={getPnlStyle(entry.team, entry.pnl)}>{Number(entry.pnl ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
