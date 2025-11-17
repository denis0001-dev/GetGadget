import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { postEvent } from '@telegram-apps/sdk';
import styles from './BottomNav.module.scss';

interface NavItem {
    path: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { path: '/home', label: 'Главная', icon: '🎴' },
    { path: '/collection', label: 'Коллекция', icon: '📚' },
    { path: '/build', label: 'Собрать', icon: '🖥️' },
    { path: '/profile', label: 'Профиль', icon: '👤' },
    { path: '/help', label: 'Помощь', icon: '❓' },
];

interface BottomNavProps {
    currentPath: string;
}

export default function BottomNav({ currentPath }: BottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path: string) => {
        postEvent('web_app_trigger_haptic_feedback', {
            type: 'selection_change',
        });
        navigate(path, { state: { from: location.pathname } });
    };

    const currentIndex = navItems.findIndex(item => item.path === currentPath);

    return (
        <nav className={styles.bottomNav}>
            <div className={styles.navContent}>
                {navItems.map((item, index) => {
                    const isActive = item.path === currentPath;
                    const offset = index - currentIndex;

                    return (
                        <button
                            key={item.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    className={styles.activeIndicator}
                                    layoutId="activeIndicator"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}


