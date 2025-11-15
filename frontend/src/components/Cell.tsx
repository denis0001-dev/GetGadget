import React from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface CellProps {
    children: React.ReactNode;
    before?: React.ReactNode;
    after?: React.ReactNode;
    onClick?: () => void;
    multiline?: boolean;
    style?: React.CSSProperties;
    index?: number;
}

export function Cell({
    children,
    before,
    after,
    onClick,
    multiline = false,
    style,
    index = 0,
}: CellProps) {
    const theme = getTelegramTheme();
  
    const cellStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        padding: '12px 16px',
        backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
        borderBottom: theme.isDark ? '1px solid #2c2c2e' : '1px solid #e5e5e7',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: multiline ? '60px' : '44px',
        ...style,
    };

    const contentStyle: React.CSSProperties = {
        flex: 1,
        color: theme.isDark ? '#ffffff' : '#000000',
        fontSize: '16px',
        lineHeight: multiline ? '1.4' : '1.2',
    };

    return (
        <motion.div
            onClick={onClick}
            style={cellStyle}
            whileHover={onClick ? { backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5' } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.03,
            }}
        >
            {before && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.03 + 0.1, type: "spring", stiffness: 200 }}
                    style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}
                >
                    {before}
                </motion.div>
            )}
            <div style={contentStyle}>{children}</div>
            {after && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.03 + 0.15, type: "spring", stiffness: 200 }}
                    style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}
                >
                    {after}
                </motion.div>
            )}
        </motion.div>
    );
}

