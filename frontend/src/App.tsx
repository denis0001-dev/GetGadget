import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { postEvent, retrieveLaunchParams } from '@telegram-apps/sdk';
import SafeAreaView from './components/SafeAreaView/SafeAreaView';
import BottomNav from './components/BottomNav/BottomNav';
import AppBackground from './components/AppBackground/AppBackground';
import HomePage from './pages/Home/HomePage';
import CollectionPage from './pages/Collection/CollectionPage';
import CardDetailPage from './pages/Collection/CardDetailPage';
import BuildPage from './pages/Build/BuildPage';
import ProfilePage from './pages/Profile/ProfilePage';
import HelpPage from './pages/Help/HelpPage';
import styles from './App.module.scss';

const routes = [
    { path: '/home', component: HomePage },
    { path: '/collection', component: CollectionPage },
    { path: '/build', component: BuildPage },
    { path: '/profile', component: ProfilePage },
    { path: '/help', component: HelpPage },
];

const tabRoutes = ['/home', '/collection', '/build', '/profile', '/help'];
const tabNames = ['home', 'collection', 'build', 'profile', 'help'];

function App() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Telegram Mini App
        const initTelegramApp = async () => {
            try {
                // Expand app to fullscreen
                postEvent('web_app_expand');

                // Set up theme colors
                const { themeParams } = retrieveLaunchParams();
                if (themeParams) {
                    document.documentElement.style.setProperty(
                        '--tg-theme-bg-color',
                        themeParams.bgColor || '#ffffff'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-text-color',
                        themeParams.textColor || '#000000'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-button-color',
                        themeParams.buttonColor || '#2481cc'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-button-text-color',
                        themeParams.buttonTextColor || '#ffffff'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-link-color',
                        themeParams.linkColor || '#2481cc'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-secondary-bg-color',
                        themeParams.secondaryBgColor || '#f1f1f1'
                    );
                }

                // Set background color
                postEvent('web_app_set_background_color', {
                    color: themeParams?.bgColor || '#ffffff',
                });

                // Set header color
                postEvent('web_app_set_header_color', {
                    color_key: 'bg_color',
                });
            } catch (error) {
                console.error('Error initializing Telegram app:', error);
            }
        };

        initTelegramApp();
    }, []);

    // Redirect root to home
    useEffect(() => {
        if (location.pathname === '/') {
            navigate('/home', { replace: true });
        }
    }, [location.pathname, navigate]);

    const currentPath = location.pathname === '/' ? '/home' : location.pathname;
    const currentTabIndex = tabRoutes.indexOf(currentPath);
    const prevTabIndex = currentTabIndex >= 0 && location.state?.from 
        ? tabRoutes.indexOf(location.state.from) 
        : -1;

    // Determine animation direction
    const direction = prevTabIndex >= 0 && currentTabIndex > prevTabIndex ? 1 : -1;

    return (
        <SafeAreaView>
            <AppBackground />
            <div className={styles.app}>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentPath}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -100 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={styles.content}
                    >
                        <Routes location={location}>
                            {routes.map(({ path, component: Component }) => (
                                <Route key={path} path={path} element={<Component />} />
                            ))}
                            <Route path="/collection/card/:cardId" element={<CardDetailPage />} />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
                <BottomNav currentPath={currentPath} />
            </div>
        </SafeAreaView>
    );
}

export default App;

