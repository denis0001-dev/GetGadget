import React from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface ListProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export function List({ children, style }: ListProps) {
    const theme = getTelegramTheme();
  
    const listStyle: React.CSSProperties = {
        backgroundColor: theme.isDark ? '#000000' : '#f7f7f8',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '16px',
        ...style,
    };

    return (
        <motion.div
            style={listStyle}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
        >
            {children}
        </motion.div>
    );
}

