import React from 'react';
import type { MaterialBreakdown } from '../../types/dashboard.types';
import type { Invoice } from '../../types/invoice.types';
import { CURRENCY, CURRENCY_LOCALE } from '../../constants/company.constants';

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
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
