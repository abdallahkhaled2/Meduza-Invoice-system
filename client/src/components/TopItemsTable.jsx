const React = require('react');

function TopItemsTable({ items = [] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 4px' }}>Item</th>
          <th style={{ textAlign: 'right', padding: '8px 4px' }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '8px 4px' }}>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.item_id}>
            <td style={{ padding: '8px 4px' }}>{it.name || `#${it.item_id}`}</td>
            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{it.qty}</td>
            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{Number(it.revenue || 0).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

module.exports = TopItemsTable;
