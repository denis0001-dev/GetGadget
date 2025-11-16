import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

export function EdgeBackground() {
    const theme = getTelegramTheme();
    const primary = theme.isDark ? 'rgba(51,144,236,0.35)' : 'rgba(51,144,236,0.30)';
    const accent = theme.isDark ? 'rgba(255,96,64,0.28)' : 'rgba(255,96,64,0.24)';

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
            {/* gradient blobs */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0.6 }}
                animate={{ scale: 1.08, opacity: 0.7 }}
                transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse' }}
                style={{
                    position: 'absolute',
                    top: '-25%',
                    left: '-10%',
                    width: '70%',
                    height: '70%',
                    filter: 'blur(90px)',
                    background: `radial-gradient(50% 50% at 50% 50%, ${primary} 0%, rgba(0,0,0,0) 100%)`,
                }}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1.12, opacity: 0.6 }}
                transition={{ duration: 14, repeat: Infinity, repeatType: 'reverse' }}
                style={{
                    position: 'absolute',
                    bottom: '-30%',
                    right: '-15%',
                    width: '80%',
                    height: '80%',
                    filter: 'blur(110px)',
                    background: `radial-gradient(50% 50% at 50% 50%, ${accent} 0%, rgba(0,0,0,0) 100%)`,
                }}
            />
        </div>
    );
}
