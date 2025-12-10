import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children, style }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #374151',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        ...style,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 16, color: '#e5e7eb', fontSize: 18, fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </div>
  );
};
