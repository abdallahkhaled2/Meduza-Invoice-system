import React from 'react';
import type { MaterialBreakdown } from '../../types/dashboard.types';
import type { Invoice } from '../../types/invoice.types';
import { CURRENCY, CURRENCY_LOCALE } from '../../constants/company.constants';
import { escapeCSV, downloadCSV } from '../../utils/export.utils';

interface MaterialBreakdownTableProps {
  materials: MaterialBreakdown[];
  invoices: Invoice[];
  selectedInvoiceId: string;
  onInvoiceSelect: (invoiceId: string) => void;
}

export const MaterialBreakdownTable: React.FC<MaterialBreakdownTableProps> = ({
  materials,
  invoices,
  selectedInvoiceId,
  onInvoiceSelect,
}) => {
  const totalCost = materials.reduce((sum, m) => sum + m.total_cost, 0);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const handleExport = () => {
    if (materials.length === 0) return;

    const lines: string[] = [];
    const invoiceLabel = selectedInvoice
      ? `${selectedInvoice.invoice_no} - ${selectedInvoice.project_name}`
      : 'All Invoices';

    lines.push(`Material Breakdown - ${invoiceLabel}`);
    lines.push('');
    lines.push(['Material', 'Total Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Used In'].map(escapeCSV).join(','));

    materials.forEach((m) => {
      lines.push(
        [
          m.material_name,
          m.total_qty.toFixed(2),
          m.unit,
          m.unit_cost.toFixed(2),
          m.total_cost.toFixed(2),
          `${m.usage_count} items`,
        ].map(escapeCSV).join(',')
      );
    });

    lines.push('');
    lines.push(['TOTAL', '', '', '', totalCost.toFixed(2), ''].join(','));

    const csvContent = lines.join('\n');
    const filename = `material-breakdown-${selectedInvoice?.invoice_no || 'all'}.csv`;
    downloadCSV(filename, csvContent);
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#9ca3af', fontSize: 14 }}>Select Invoice:</label>
        <select
          value={selectedInvoiceId}
          onChange={(e) => onInvoiceSelect(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 6,
            color: '#e5e7eb',
            fontSize: 14,
            minWidth: 300,
          }}
        >
          <option value="">-- Select an invoice --</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoice_no} - {inv.project_name} ({new Date(inv.invoice_date).toLocaleDateString()})
            </option>
          ))}
        </select>
        {selectedInvoiceId && (
          <button
            onClick={() => onInvoiceSelect('')}
            style={{
              padding: '6px 12px',
              background: '#374151',
              border: 'none',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        {materials.length > 0 && (
          <button
            onClick={handleExport}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        )}
      </div>

      {materials.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Material
              </th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Total Quantity
              </th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Unit
              </th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Unit Cost
              </th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Total Cost
              </th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                Used In
              </th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14 }}>
                  {material.material_name}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {material.total_qty.toFixed(2)}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {material.unit}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {material.unit_cost.toLocaleString(CURRENCY_LOCALE, {
                    style: 'currency',
                    currency: CURRENCY,
                    minimumFractionDigits: 0,
                  })}
                </td>
                <td style={{ padding: '12px 0', color: '#38bdf8', fontSize: 14, textAlign: 'right', fontWeight: 500 }}>
                  {material.total_cost.toLocaleString(CURRENCY_LOCALE, {
                    style: 'currency',
                    currency: CURRENCY,
                    minimumFractionDigits: 0,
                  })}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {material.usage_count} items
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #374151', background: 'rgba(6, 95, 70, 0.15)' }}>
              <td style={{ padding: '14px 0', color: '#e5e7eb', fontSize: 15, fontWeight: 700 }}>
                TOTAL
              </td>
              <td style={{ padding: '14px 0' }}></td>
              <td style={{ padding: '14px 0' }}></td>
              <td style={{ padding: '14px 0' }}></td>
              <td style={{ padding: '14px 0', color: '#34d399', fontSize: 16, textAlign: 'right', fontWeight: 700 }}>
                {totalCost.toLocaleString(CURRENCY_LOCALE, {
                  style: 'currency',
                  currency: CURRENCY,
                  minimumFractionDigits: 0,
                })}
              </td>
              <td style={{ padding: '14px 0' }}></td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
          {selectedInvoiceId
            ? 'No materials found for this invoice'
            : 'Please select an invoice to view material breakdown'}
        </div>
      )}
    </div>
  );
};
