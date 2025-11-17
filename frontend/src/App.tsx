import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { init, postEvent, retrieveLaunchParams, viewport, miniApp } from '@telegram-apps/sdk';
import SafeAreaView from '@/components/SafeAreaView/SafeAreaView';
import BottomNav from '@/components/BottomNav/BottomNav';
import AppBackground from '@/components/AppBackground/AppBackground';
import HomePage from '@/pages/Home/HomePage';
import CollectionPage from '@/pages/Collection/CollectionPage';
import CardDetailPage from '@/pages/Collection/CardDetailPage';
import BuildPage from '@/pages/Build/BuildPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import HelpPage from '@/pages/Help/HelpPage';
import styles from '@/App.module.scss';

const routes = [
    { path: '/home', component: HomePage },
    { path: '/collection', component: CollectionPage },
    { path: '/build', component: BuildPage },
    { path: '/profile', component: ProfilePage },
    { path: '/help', component: HelpPage },
];

const tabRoutes = ['/home', '/collection', '/build', '/profile', '/help'];

export default function App() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Telegram Mini App
        const initTelegramApp = async () => {
            try {
                // Initialize SDK first (required before using any components)
                await init();
                console.log('SDK initialized successfully');
                
                // Try to expand immediately using postEvent (works in most cases)
                postEvent('web_app_expand');
                
                // Set up theme colors
                const launchParams = retrieveLaunchParams();
                const { themeParams } = launchParams;
                
                // Mount MiniApp component first (required for other features)
                await miniApp.mount();
                
                // Mount viewport component (required for safe area insets and fullscreen)
                await viewport.mount();
                
                // Expand viewport to fullscreen (edge-to-edge) using SDK
                console.log('Attempting to expand viewport...');
                console.log('expand.isAvailable():', viewport.expand.isAvailable());
                try {
                    if (viewport.expand.isAvailable()) {
                        viewport.expand();
                        console.log('viewport.expand() called successfully');
                    } else {
                        console.warn('viewport.expand() not available, using postEvent');
                        postEvent('web_app_expand');
                    }
                } catch (e) {
                    console.error('Expand failed:', e);
                    try {
                        postEvent('web_app_expand');
                    } catch (postError) {
                        console.error('postEvent expand also failed:', postError);
                    }
                }
                
                // Request fullscreen mode
                console.log('Attempting to request fullscreen...');
                console.log('requestFullscreen.isAvailable():', viewport.requestFullscreen.isAvailable());
                try {
                    if (viewport.requestFullscreen.isAvailable()) {
                        await viewport.requestFullscreen();
                        console.log('viewport.requestFullscreen() called successfully');
                    } else {
                        console.warn('viewport.requestFullscreen() not available');
                    }
                } catch (fullscreenError) {
                    console.error('Fullscreen request failed:', fullscreenError);
                }
                
                // Try expand again after a short delay (some clients need this)
                setTimeout(() => {
                    try {
                        postEvent('web_app_expand');
                        console.log('Retry expand after delay');
                    } catch (e) {
                        console.warn('Delayed expand failed:', e);
                    }
                }, 100);
                
                if (themeParams) {
                    const theme = themeParams as Record<string, string | undefined>;
                    document.documentElement.style.setProperty(
                        '--tg-theme-bg-color',
                        theme.bgColor || '#ffffff'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-text-color',
                        theme.textColor || '#000000'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-button-color',
                        theme.buttonColor || '#2481cc'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-button-text-color',
                        theme.buttonTextColor || '#ffffff'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-link-color',
                        theme.linkColor || '#2481cc'
                    );
                    document.documentElement.style.setProperty(
                        '--tg-theme-secondary-bg-color',
                        theme.secondaryBgColor || '#f1f1f1'
                    );
                }
                
                // Bind viewport properties to CSS variables
                // This automatically creates and updates CSS variables:
                // --tg-viewport-height, --tg-viewport-width, --tg-viewport-stable-height
                // --tg-viewport-safe-area-inset-top, --tg-viewport-safe-area-inset-bottom, etc.
                // These are used in SafeAreaView.module.scss
                viewport.bindCssVars();
                
                // Bind MiniApp properties to CSS variables as well
                miniApp.bindCssVars();

                // Set background color
                if (themeParams) {
                    const theme = themeParams as Record<string, string | undefined>;
                    const bgColor = theme.bgColor || '#ffffff';
                    // Ensure color is in #RRGGBB format
                    const formattedColor = bgColor.startsWith('#') ? bgColor : `#${bgColor}`;
                    postEvent('web_app_set_background_color', {
                        color: formattedColor as `#${string}`,
                    });
                }

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