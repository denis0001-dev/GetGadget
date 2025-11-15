import React from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface LoadingProps {
    text?: string;
}

export function Loading({ text = 'Загрузка...' }: LoadingProps) {
    const theme = getTelegramTheme();
  
    return (
        <motion.div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: theme.isDark ? '#ffffff' : '#000000',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                style={{
                    width: '40px',
                    height: '40px',
                    border: `3px solid ${theme.isDark ? '#2c2c2e' : '#e5e5e7'}`,
                    borderTop: `3px solid ${theme.isDark ? '#ffffff' : '#3390ec'}`,
                    borderRadius: '50%',
                    marginBottom: '16px',
                }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <motion.div
                style={{ fontSize: '16px' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {text}
            </motion.div>
        </motion.div>
    );
}

