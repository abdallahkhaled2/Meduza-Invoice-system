import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = '#38bdf8',
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #374151',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
