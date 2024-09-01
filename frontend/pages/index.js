import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';
import DynamicGraph from '../components/DynamicGraph';
import Head from 'next/head';

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleAgentSelection = (agentId) => {
    setSelectedAgent(agentId);
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
          <DynamicGraph agentId={'team-001'} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
