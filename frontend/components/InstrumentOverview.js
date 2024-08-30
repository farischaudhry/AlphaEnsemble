import React, { useEffect, useState } from 'react';
import { listenToEvents } from '../contracts/contractInteraction';
import styles from '../styles/InstrumentOverview.module.css';

function InstrumentOverview() {
  const [instruments, setInstruments] = useState([]);

  useEffect(() => {
    // Listen to events from the contract to update the instrument overview
    listenToEvents(updateInstrumentOverview, () => {});

    // Cleanup listener when component unmounts
    return () => {
      // Optionally remove listeners here if needed
    };
  }, []);

  const updateInstrumentOverview = (newInstrumentData) => {
    setInstruments(prevInstruments => {
      // Map over existing instruments to find if any need updating
      const updatedInstruments = prevInstruments.map(instrument => {
        const matchingNewInstrument = newInstrumentData.find(
          newInstrument => newInstrument.asset === instrument.asset
        );
        return matchingNewInstrument ? matchingNewInstrument : instrument;
      });

      // Add any new instruments that were not already in the list
      newInstrumentData.forEach(newInstrument => {
        if (!prevInstruments.some(instrument => instrument.asset === newInstrument.asset)) {
          updatedInstruments.push(newInstrument);
        }
      });

      // Return the updated instrument list
      return updatedInstruments;
    });
  };

  return (
    <div className={styles['instrument-overview']}>
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
