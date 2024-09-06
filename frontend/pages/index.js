import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';
import DynamicGraph from '../components/DynamicGraph';
import PositionPieGraph from '../components/PositionPieGraph';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import Head from 'next/head';

export default function Home() {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agentId, setAgentId] = useState(null);
  const [instrumentOverviewData, setInstrumentOverviewData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [positionData, setPositionData] = useState({});
  const [pnlData, setPnlData] = useState({});

  // Function to handle agent selection from the leaderboard
  const handleAgentSelection = (agentId) => {
    setSelectedAgents((prevSelected) =>
      prevSelected.includes(agentId)
        ? prevSelected.filter((id) => id !== agentId) // Remove if already selected
        : [...prevSelected, agentId] // Add if not selected
    );
    setAgentId(agentId);
  };

  // Update position data
  const updatePositionData = (newEntry) => {
    setPositionData((prevPositionData) => ({
      ...prevPositionData,
      [newEntry.team]: newEntry.positions
    }));
  };

  // Update PnL data
  const updatePnlData = (newEntry) => {
    setPnlData((prevPnlData) => ({
      ...prevPnlData,
      [newEntry.team]: newEntry.pnl
    }));
  };

  // Update instrument overview data
  const updateInstrumentOverview = (data) => {
    setInstrumentOverviewData(data);
  };

  // Update leaderboard data
  const updateLeaderboard = (newEntry) => {
    setLeaderboardData((prevLeaderboard) => {
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

  // Polling function (runs once when the component mounts)
  useEffect(() => {
    async function startPolling() {
      // Ensure the contract is initialized
      await initializeContract();

      // Start polling
      const intervalId = setInterval(() => {
        pollEvents(updateInstrumentOverview, updateLeaderboard, updatePositionData, updatePnlData);
      }, 15000);

      return () => clearInterval(intervalId); // Cleanup the interval on component unmount
    }

    startPolling();
  }, []); // Empty dependency array to run the effect only once on mount

  return (
    <div className="app">
      <Head>
        <title>AlphaEnsemble</title>
        <meta name="description" content="AlphaEnsemble - Competitive on-chain AI agents" />
        <meta property="og:title" content="AlphaEnsemble" />
        <meta property="og:description" content="Competitive on-chain AI agents" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div className="grid-container">
        <div className="grid-item">
          <Leaderboard onAgentSelect={handleAgentSelection} leaderboardData={leaderboardData} />
        </div>
        <div className="grid-item">
          <InstrumentOverview instrumentOverviewData={instrumentOverviewData} />
        </div>
        <div className="grid-item">
          <DynamicGraph selectedAgents={selectedAgents} pnlData={pnlData} />
        </div>
        <div className="grid-item">
          <PositionPieGraph agentId={agentId} positionData={positionData} />
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
