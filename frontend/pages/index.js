import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';
import DynamicGraph from '../components/DynamicGraph';
import PositionPieGraph from '../components/PositionPieGraph';
import { initializeContract, pollEvents } from '../contracts/contractInteraction';
import Head from 'next/head';

function getColor(index) {
  const predefinedColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FF8C33', '#33A1FF'];
  return predefinedColors[index % predefinedColors.length];
}

export default function Home() {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agentId, setAgentId] = useState(null);
  const [instrumentOverviewData, setInstrumentOverviewData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [positionData, setPositionData] = useState({});
  const [pnlData, setPnlData] = useState({});
  const [timestamps, setTimestamps] = useState(new Set());

  // Function to handle agent selection from the leaderboard
  const handleAgentSelection = useCallback((agentId) => {
    setSelectedAgents((prevSelected) =>
      prevSelected.includes(agentId)
        ? prevSelected.filter((id) => id !== agentId)
        : [...prevSelected, agentId]
    );
    setAgentId(agentId);
  }, []);

  const addTimestamp = useCallback(() => {
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimestamps((prevTimestamps) => {
      const updatedTimestamps = new Set(prevTimestamps);
      updatedTimestamps.add(timeString); // Add the new timestamp
      const timestampArray = Array.from(updatedTimestamps); // Convert Set back to array
      if (timestampArray.length > 10) {
        return new Set(timestampArray.slice(-10));
      }
      return updatedTimestamps;
    });
  }, []);

  const updatePositionData = useCallback((newEntry) => {
    setPositionData((prevPositionData) => ({
      ...prevPositionData,
      [newEntry.team]: newEntry.positions.reduce((acc, { asset, position }) => {
        acc[asset] = position;
        return acc;
      }, {}),
    }));
  }, []);

  const updatePnlData = useCallback((newEntry) => {
    setPnlData((prevPnlData) => ({
      ...prevPnlData,
      [newEntry.team]: {
        data: [...(prevPnlData[newEntry.team]?.data || []), newEntry.pnl],
        color: prevPnlData[newEntry.team]?.color || getColor(Object.keys(prevPnlData).length),
      }
    }));
    addTimestamp();
  }, [addTimestamp]);

  const updateInstrumentOverview = useCallback((data) => {
    setInstrumentOverviewData(data);
  }, []);

  const updateLeaderboard = useCallback((newEntry) => {
    setLeaderboardData((prevLeaderboard) => {
      const existingEntryIndex = prevLeaderboard.findIndex(entry => entry.team === newEntry.team);
      let updatedLeaderboard;
      if (existingEntryIndex !== -1) {
        updatedLeaderboard = [...prevLeaderboard];
        updatedLeaderboard[existingEntryIndex] = { ...updatedLeaderboard[existingEntryIndex], ...newEntry };
      } else {
        updatedLeaderboard = [...prevLeaderboard, newEntry];
      }
      return updatedLeaderboard.sort((a, b) => b.pnl - a.pnl);
    });
  }, []);

  // Polling function with useEffect
  useEffect(() => {
    let isMounted = true;
    async function startPolling() {
      await initializeContract();
      const intervalId = setInterval(() => {
        if (isMounted) {
          pollEvents(updateInstrumentOverview, updateLeaderboard, updatePositionData, updatePnlData);
        }
      }, 15000);

      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
    startPolling();
  }, [updateInstrumentOverview, updateLeaderboard, updatePositionData, updatePnlData]);

  // Memoized components to avoid unnecessary re-renders
  const memoizedLeaderboard = useMemo(() => (
    <Leaderboard onAgentSelect={handleAgentSelection} leaderboardData={leaderboardData} />
  ), [leaderboardData, handleAgentSelection]);

  const memoizedInstrumentOverview = useMemo(() => (
    <InstrumentOverview instrumentOverviewData={instrumentOverviewData} />
  ), [instrumentOverviewData]);

  const memoizedDynamicGraph = useMemo(() => (
    <DynamicGraph selectedAgents={selectedAgents} pnlData={pnlData} timestamps={Array.from(timestamps)} />
  ), [selectedAgents, pnlData, timestamps]);

  const memoizedPositionPieGraph = useMemo(() => (
    <PositionPieGraph agentId={agentId} positionData={positionData} />
  ), [agentId, positionData]);

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
          {memoizedLeaderboard}
        </div>
        <div className="grid-item">
          {memoizedInstrumentOverview}
        </div>
        <div className="grid-item">
          {memoizedDynamicGraph}
        </div>
        <div className="grid-item">
          {memoizedPositionPieGraph}
        </div>
      </div>
    </div>
  );
}
