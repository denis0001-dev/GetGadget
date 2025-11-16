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
import { TabBar } from './components/TabBar';
import './App.css';
import type { TelegramIconName } from './components/TelegramIcon';

export function App() {
    const [theme, setTheme] = useState(getTelegramTheme());

    useEffect(() => {
        initTelegram();
        setTheme(getTelegramTheme());
        const telegramTheme = getTelegramTheme();
        document.body.style.backgroundColor = telegramTheme.backgroundColor;
        document.body.style.color = telegramTheme.textColor;
        const user = getTelegramUser();
        if (!user) {
            console.warn('Telegram user not found. App should be opened from Telegram.');
        }
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

    const tabItems: Array<{ path: string; label: string; icon: TelegramIconName }> = [
        { path: '/', label: 'Главная', icon: 'home' },
        { path: '/collection', label: 'Коллекция', icon: 'collection' },
        { path: '/build', label: 'Сборка', icon: 'build' },
        { path: '/profile', label: 'Профиль', icon: 'profile' },
    ];

    return (
        <BrowserRouter>
            <div className="app" style={{ 
                minHeight: '100vh', 
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
                paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0) + var(--tg-safe-area-bottom, 0px) + 8px)',
                paddingTop: 'calc(env(safe-area-inset-top, 0) + var(--tg-safe-area-top, 0px) + 6px)',
                paddingLeft: 'calc(env(safe-area-inset-left, 0) + var(--tg-safe-area-left, 0px) + 6px)',
                paddingRight: 'calc(env(safe-area-inset-right, 0) + var(--tg-safe-area-right, 0px) + 6px)'
            }}>
                <AnimatedRoutes tabItems={tabItems} />
                <TabBar items={tabItems} />
            </div>
        </BrowserRouter>
    );
}

function AnimatedRoutes({ tabItems }: { tabItems: Array<{ path: string }> }) {
    const location = useLocation();
    const navigationType = useNavigationType();
    const [direction, setDirection] = useState(1);

    // Path stack fallback
    const pathStackRef = useRef<string[]>([location.pathname]);
    const currentIndexRef = useRef<number>(0);

    // Tab-based direction
    const tabOrder = tabItems.map(t => t.path);
    const prevTabPathRef = useRef<string>(location.pathname);

    useEffect(() => {
        // Tab-based priority
        const currentPath = location.pathname;
        const prevPath = prevTabPathRef.current;
        const currentTabIdx = tabOrder.findIndex(p => currentPath.startsWith(p));
        const prevTabIdx = tabOrder.findIndex(p => prevPath.startsWith(p));
        if (currentTabIdx !== -1 && prevTabIdx !== -1 && currentTabIdx !== prevTabIdx) {
            // Slide direction by tab order difference
            setDirection(currentTabIdx > prevTabIdx ? 1 : -1);
            prevTabPathRef.current = currentPath;
            return;
        }

        // Stack fallback
        const stack = pathStackRef.current;
        const currentIdx = currentIndexRef.current;
        const nextPath = currentPath;
        const existingIdx = stack.indexOf(nextPath);
        let newDir = 1;
        if (existingIdx !== -1) {
            newDir = existingIdx < currentIdx ? -1 : 1;
            pathStackRef.current = stack.slice(0, existingIdx + 1);
            currentIndexRef.current = existingIdx;
        } else {
            pathStackRef.current = [...stack.slice(0, currentIdx + 1), nextPath];
            currentIndexRef.current = currentIdx + 1;
            newDir = 1;
        }
        if (navigationType === 'POP' && newDir !== -1) {
            newDir = -1;
        }
        setDirection(newDir);
        prevTabPathRef.current = currentPath;
    }, [location, navigationType]);

    const pageVariants = {
        initial: (dir: number) => ({
            x: dir > 0 ? '-100%' : '100%',
            opacity: 0,
            zIndex: 2,
        }),
        animate: {
            x: 0,
            opacity: 1,
            zIndex: 2,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 0,
        }),
    };

    const pageTransition = {
        type: 'tween',
        ease: 'easeInOut',
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh' }}
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

