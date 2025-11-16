import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface QuickActionProps {
    icon: string;
    label: string;
    onClick: () => void;
}

export function QuickAction({ icon, label, onClick }: QuickActionProps) {
    const theme = getTelegramTheme();
    const bg = theme.isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 100%)';
    const border = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: '10px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: theme.isDark ? '#fff' : '#000',
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 13 }}>{label}</span>
        </motion.button>
    );
}
