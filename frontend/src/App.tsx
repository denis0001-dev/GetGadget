import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
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
    const navigationType = useNavigationType();
    const [direction, setDirection] = useState(1); // 1 -> forward (slide left), -1 -> backward (slide right)

    // Robust direction tracking using a simple path stack
    const pathStackRef = useRef<string[]>([location.pathname]);
    const currentIndexRef = useRef<number>(0);

    useEffect(() => {
        const stack = pathStackRef.current;
        const currentIdx = currentIndexRef.current;
        const nextPath = location.pathname;
        const existingIdx = stack.indexOf(nextPath);

        let newDir = 1;
        if (existingIdx !== -1) {
            // Path exists in stack: if it's before current, we're going back
            newDir = existingIdx < currentIdx ? -1 : 1;
            // Trim stack to this point (simulate browser back forward behavior)
            pathStackRef.current = stack.slice(0, existingIdx + 1);
            currentIndexRef.current = existingIdx;
        } else {
            // New path: push and move forward
            pathStackRef.current = [...stack.slice(0, currentIdx + 1), nextPath];
            currentIndexRef.current = currentIdx + 1;
            newDir = 1;
        }

        // Fallback for POP where stack may not change as expected
        if (navigationType === 'POP' && newDir !== -1) {
            newDir = -1;
        }

        setDirection(newDir);
    }, [location, navigationType]);

    const pageVariants = {
        initial: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 2,
        }),
        animate: {
            x: 0,
            opacity: 1,
            zIndex: 2,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '-100%' : '100%',
            opacity: 0,
            zIndex: 0,
        }),
    };

    const pageTransition = {
        type: "tween",
        ease: "easeInOut",
        duration: 0.3,
    };

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
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
                                custom={direction}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    minHeight: '100vh',
                                }}
                            >
                                <Profile />
                            </motion.div>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </div>
    );
}

