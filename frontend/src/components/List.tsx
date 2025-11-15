import React from 'react';
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

    return <div style={listStyle}>{children}</div>;
}

