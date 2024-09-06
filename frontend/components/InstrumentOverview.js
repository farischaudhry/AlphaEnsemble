import React, { useEffect, useState } from 'react';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import styles from '../styles/InstrumentOverview.module.css';

function InstrumentOverview() {
  const [instruments, setInstruments] = useState([]);

  const updateInstrumentOverview = (newInstrumentData) => {
    setInstruments(prevInstruments => {
      const updatedInstruments = prevInstruments.map(instrument => {
        const matchingNewInstrument = newInstrumentData.find(
          newInstrument => newInstrument.asset === instrument.asset
        );
        return matchingNewInstrument ? matchingNewInstrument : instrument;
      });

      newInstrumentData.forEach(newInstrument => {
        if (!prevInstruments.some(instrument => instrument.asset === newInstrument.asset)) {
          updatedInstruments.push(newInstrument);
        }
      });

      return updatedInstruments;
    });
  };

  useEffect(() => {
    async function startPolling() {
      // Ensure the contract is initialized
      await initializeContract();

      // Start polling after initialization
      const intervalId = setInterval(() => {
        pollEvents(updateInstrumentOverview, () => {});
      }, 15000);

      return () => clearInterval(intervalId);  // Cleanup the interval on component unmount
    }

    startPolling();
  }, []);

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
          {instruments.map((instrument, index) => (
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
