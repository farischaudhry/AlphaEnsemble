import React from 'react';
import styles from '../styles/InstrumentOverview.module.css';

function InstrumentOverview({ instrumentOverviewData }) {
  return (
    <div>
      <h2>Instrument Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {instrumentOverviewData.map((instrument, index) => (
            <tr key={index}>
              <td>{instrument.asset}</td>
              <td>{instrument.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InstrumentOverview;
