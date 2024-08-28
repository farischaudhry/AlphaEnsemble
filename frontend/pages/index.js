import React, { useEffect } from 'react';
import Header from '../components/Header';
import Overview from '../components/Overview';
import InstrumentOverview from '../components/InstrumentOverview';
import Leaderboard from '../components/Leaderboard';

export default function Home() {
  const leaderboardRef = React.useRef();
  
  return (
    <div className="app">
      <Header />
      <div className="content">
        <Overview />
        <Leaderboard ref={leaderboardRef} />
        <InstrumentOverview />
      </div>
    </div>
  );
}
