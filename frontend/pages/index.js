import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';
import DynamicGraph from '../components/DynamicGraph';
import PositionPieGraph from '../components/PositionPieGraph';
import Head from 'next/head';

export default function Home() {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agentId, setAgentId] = useState(null);

  const handleAgentSelection = (agentId) => {
    setSelectedAgents((prevSelected) =>
      prevSelected.includes(agentId)
        ? prevSelected.filter((id) => id !== agentId) // Remove if already selected
        : [...prevSelected, agentId] // Add if not selected
    );
    setAgentId(agentId);
  };


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
          <Leaderboard onAgentSelect={handleAgentSelection} />
        </div>
        <div className="grid-item">
          <InstrumentOverview />
        </div>
        <div className="grid-item">
          <div>
            <DynamicGraph selectedAgents={selectedAgents} /> 
          </div>       
        </div>
        <div className="grid-item">
          <PositionPieGraph agentId={agentId} /> 
        </div>
      </div>
      <Footer />
    </div>
  );
}
