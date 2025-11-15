import React from 'react';
import { motion } from 'framer-motion';
import { getTelegramTheme } from '../telegram';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    style?: React.CSSProperties;
    fullWidth?: boolean;
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    style,
    fullWidth = false,
}: ButtonProps) {
    const theme = getTelegramTheme();
  
    const baseStyle: React.CSSProperties = {
        padding: '12px 20px',
        fontSize: '16px',
        fontWeight: '500',
        border: 'none',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        ...style,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: theme.isDark ? '#3390ec' : '#3390ec',
            color: '#ffffff',
        },
        secondary: {
            backgroundColor: theme.isDark ? '#2b2b2b' : '#f0f0f0',
            color: theme.isDark ? '#ffffff' : '#000000',
        },
        danger: {
            backgroundColor: '#ff3b30',
            color: '#ffffff',
        },
    };

    return (
        <motion.button
            onClick={disabled ? undefined : onClick}
            style={{ ...baseStyle, ...variantStyles[variant] }}
            whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: disabled ? 0.5 : 1, y: 0 }}
            transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                opacity: { duration: 0.2 }
            }}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
}

