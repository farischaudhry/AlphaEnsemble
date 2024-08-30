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
      <div className="content">
        <div className="left-panel">
          <Leaderboard onAgentSelect={handleAgentSelection} />
          <InstrumentOverview />
        </div>
        <div className="right-panel">
          <DynamicGraph agentId={selectedAgent} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
