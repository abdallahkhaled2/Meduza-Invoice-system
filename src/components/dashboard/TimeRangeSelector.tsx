import React from 'react';
import type { TimeRange } from '../../types/dashboard.types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const options: { value: TimeRange; label: string }[] = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: value === option.value ? '1px solid #38bdf8' : '1px solid #374151',
            background: value === option.value ? '#1e3a4f' : '#1f2937',
            color: value === option.value ? '#38bdf8' : '#9ca3af',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
