import React from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface CardProps {
    children: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
    index?: number;
}

export function Card({ children, onClick, style, index = 0 }: CardProps) {
    const theme = getTelegramTheme();
  
    const cardStyle: React.CSSProperties = {
        backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        border: theme.isDark ? '1px solid #2c2c2e' : '1px solid #e5e5e7',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
    };

    return (
        <motion.div
            onClick={onClick}
            style={cardStyle}
            whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
            }}
        >
            {children}
        </motion.div>
    );
}

