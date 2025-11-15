import React from 'react';
import { getTelegramTheme } from '../telegram';

interface CardProps {
    children: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export function Card({ children, onClick, style }: CardProps) {
    const theme = getTelegramTheme();
  
    const cardStyle: React.CSSProperties = {
        backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        border: theme.isDark ? '1px solid #2c2c2e' : '1px solid #e5e5e7',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s, opacity 0.1s',
        ...style,
    };

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick) {
            e.currentTarget.style.transform = 'scale(0.98)';
            e.currentTarget.style.opacity = '0.8';
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
        }
    };

    return (
        <div
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={cardStyle}
        >
            {children}
        </div>
    );
}

