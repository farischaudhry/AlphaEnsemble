import React, { useState } from 'react';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, team: 'team-001', pnl: 13162.20, hourlyPnl: 44.10, hourlySharpe: 0.01, position: 0, delta: 0.00, vega: 0.00 }
    // Add initial entries if needed
  ]);

  // Function to add or update an entry
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
  
      // Sort the leaderboard by rank
      return updatedLeaderboard.sort((a, b) => a.rank - b.rank);
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
            <th>Hourly PnL</th>
            <th>Hourly Sharpe</th>
            <th>Position</th>
            <th>Delta</th>
            <th>Vega</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index}>
              <td>{entry.rank}</td>
              <td>{entry.team}</td>
              <td>{entry.pnl.toFixed(2)}</td>
              <td>{entry.hourlyPnl.toFixed(2)}</td>
              <td>{entry.hourlySharpe.toFixed(2)}</td>
              <td>{entry.position}</td>
              <td>{entry.delta.toFixed(2)}</td>
              <td>{entry.vega.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
