import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';
import DynamicGraph from '../components/DynamicGraph';

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleAgentSelection = (agentId) => {
    setSelectedAgent(agentId);
  };

  return (
    <div className="app">
      <Header />
      <div className="grid-container">
        <div className="grid-item">
          <Leaderboard onAgentSelect={handleAgentSelection} />
        </div>
        <div className="grid-item">
          <InstrumentOverview />
        </div>
        <div className="grid-item">
          <DynamicGraph agentId={selectedAgent} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
