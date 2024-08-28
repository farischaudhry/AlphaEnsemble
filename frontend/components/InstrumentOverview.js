import React from 'react';

function InstrumentOverview() {
  return (
    <div className="instrument-overview">
      <h2>Instrument Overview</h2>
      <ul>
        <li><span>CSCO</span> - 625 - 74.50</li>
        <li><span>ING</span> - 200 - 203.90</li>
        <li><span>NVDA</span> - 625 - 186.20</li>
        {/* Add more list items based on your data */}
      </ul>
    </div>
  );
}

export default InstrumentOverview;
