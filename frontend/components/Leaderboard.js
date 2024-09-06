import React from 'react';
import styles from '../styles/Leaderboard.module.css';

function Leaderboard({ onAgentSelect, leaderboardData }) {
  const handleRowClick = (agentId) => {
    if (onAgentSelect) {
      onAgentSelect(agentId);
    }
  };

  const getPnlStyle = (team, pnl) => {
    return pnl > 0 ? { color: 'green' } : { color: 'red' };
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
          {leaderboardData.map((entry, index) => (
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
