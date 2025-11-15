import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initTelegram, getTelegramUser } from './telegram';
import Home from './pages/Home';
import Collection from './pages/Collection';
import CardDetails from './pages/CardDetails';
import Build from './pages/Build';
import PCs from './pages/PCs';
import PCDetails from './pages/PCDetails';
import Trade from './pages/Trade';
import Profile from './pages/Profile';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize Telegram Web App
    initTelegram();
    
    // Check if user is authenticated
    const user = getTelegramUser();
    if (!user) {
      console.warn('Telegram user not found. App should be opened from Telegram.');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:cardId" element={<CardDetails />} />
          <Route path="/build" element={<Build />} />
          <Route path="/pcs" element={<PCs />} />
          <Route path="/pcs/:pcId" element={<PCDetails />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
