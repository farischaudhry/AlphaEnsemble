import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <h1>Hello World</h1>
      </main>
      <Footer />
    </div>
  );
}

export default App;
