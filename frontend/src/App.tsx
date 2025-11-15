import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initTelegram, getTelegramUser, getTelegramTheme } from './telegram';
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
  const [theme, setTheme] = useState(getTelegramTheme());

  useEffect(() => {
    // Initialize Telegram Web App
    initTelegram();
    
    // Update theme
    setTheme(getTelegramTheme());
    
    // Apply theme colors to document
    const telegramTheme = getTelegramTheme();
    document.body.style.backgroundColor = telegramTheme.backgroundColor;
    document.body.style.color = telegramTheme.textColor;
    
    // Check if user is authenticated
    const user = getTelegramUser();
    if (!user) {
      console.warn('Telegram user not found. App should be opened from Telegram.');
    }

    // Listen for theme changes
    const interval = setInterval(() => {
      const newTheme = getTelegramTheme();
      if (newTheme.isDark !== theme.isDark) {
        setTheme(newTheme);
        document.body.style.backgroundColor = newTheme.backgroundColor;
        document.body.style.color = newTheme.textColor;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [theme.isDark]);

  return (
    <BrowserRouter>
      <div className="app" style={{ 
        minHeight: '100vh', 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor
      }}>
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
