import React from 'react';
import { getTelegramTheme } from '../telegram';

interface HeaderProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export function Header({ children, style }: HeaderProps) {
    const theme = getTelegramTheme();
  
    const headerStyle: React.CSSProperties = {
        padding: '16px',
        backgroundColor: theme.isDark ? '#1c1c1e' : '#ffffff',
        borderBottom: theme.isDark ? '1px solid #2c2c2e' : '1px solid #e5e5e7',
        fontSize: '20px',
        fontWeight: '600',
        color: theme.isDark ? '#ffffff' : '#000000',
        ...style,
    };

    return <div style={headerStyle}>{children}</div>;
}

