import React, { useState, useEffect } from 'react';
import { listenToEvents } from '../contracts/contractInteraction';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    listenToEvents(() => {}, updateLeaderboard, updatePnL);

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

      // Sort the leaderboard by rank or PnL
      return updatedLeaderboard.sort((a, b) => b.pnl - a.pnl); // Example: sort by PnL descending
    });
  };

  const updatePnL = (agentID, pnl) => {
    setLeaderboard(prevLeaderboard => {
      const existingEntryIndex = prevLeaderboard.findIndex(entry => entry.team === `team-${agentID}`);

      if (existingEntryIndex !== -1) {
        // Update PnL for the existing entry
        const updatedLeaderboard = [...prevLeaderboard];
        updatedLeaderboard[existingEntryIndex].pnl = ethers.utils.formatUnits(pnl, 18); // Adjust formatting as necessary

        return updatedLeaderboard.sort((a, b) => b.pnl - a.pnl); // Example: sort by PnL descending
      }

      return prevLeaderboard; // No change if the entry doesn't exist
    });
  };

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Teams</th>
            <th>PnL</th>
            <th>Position</th>
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{entry.team}</td>
              <td>{entry.pnl.toFixed(2)}</td>
              <td>{entry.position}</td>
              {/* Add more fields as needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
