const React = require('react');

function KpiCard({ title, value, subtitle }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 160,
      margin: 8,
      padding: 12,
      borderRadius: 8,
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: '600', marginTop: 6 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

module.exports = KpiCard;
