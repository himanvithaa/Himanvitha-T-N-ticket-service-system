import React from 'react';
import './App.css';
import TicketList from './components/TicketList';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Ticket Service System</h1>
      </header>
      <main className="app-main">
        <TicketList />
      </main>
    </div>
  );
}

export default App;
