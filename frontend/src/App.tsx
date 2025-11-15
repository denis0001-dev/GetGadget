import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { initTelegram, getTelegramUser, getTelegramTheme } from './telegram';
import { Home } from './pages/Home';
import { Collection } from './pages/Collection';
import { CardDetails } from './pages/CardDetails';
import { Build } from './pages/Build';
import { PCs } from './pages/PCs';
import { PCDetails } from './pages/PCDetails';
import { Trade } from './pages/Trade';
import { Profile } from './pages/Profile';
import './App.css';

export function App() {
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
                <AnimatedRoutes />
            </div>
        </BrowserRouter>
    );
}

function AnimatedRoutes() {
    const location = useLocation();

    const pageVariants = {
        initial: {
            opacity: 0,
            y: 20,
            scale: 0.98,
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.98,
        },
    };

    const pageTransition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
    };

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <Home />
                        </motion.div>
                    }
                />
                <Route
                    path="/collection"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <Collection />
                        </motion.div>
                    }
                />
                <Route
                    path="/collection/:cardId"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <CardDetails />
                        </motion.div>
                    }
                />
                <Route
                    path="/build"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <Build />
                        </motion.div>
                    }
                />
                <Route
                    path="/pcs"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <PCs />
                        </motion.div>
                    }
                />
                <Route
                    path="/pcs/:pcId"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <PCDetails />
                        </motion.div>
                    }
                />
                <Route
                    path="/trade"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <Trade />
                        </motion.div>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <motion.div
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <Profile />
                        </motion.div>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

