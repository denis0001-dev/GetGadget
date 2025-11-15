import React from 'react';
import { getTelegramTheme } from '../telegram';

interface CellProps {
  children: React.ReactNode;
  before?: React.ReactNode;
  after?: React.ReactNode;
  onClick?: () => void;
  multiline?: boolean;
  style?: React.CSSProperties;
}

export const Cell: React.FC<CellProps> = ({
  children,
  before,
  after,
  onClick,
  multiline = false,
  style,
}) => {
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
    <div onClick={onClick} style={cellStyle}>
      {before && (
        <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
          {before}
        </div>
      )}
      <div style={contentStyle}>{children}</div>
      {after && (
        <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
          {after}
        </div>
      )}
    </div>
  );
};

