import React from 'react';
import type { Invoice } from '../../types/invoice.types';
import { CURRENCY, CURRENCY_LOCALE } from '../../constants/company.constants';

interface InvoicesTableProps {
  invoices: Invoice[];
  onStatusChange: (invoiceId: string, status: string) => void;
  onViewInvoice: (invoiceId: string) => void;
  onPreviewInvoice: (invoiceId: string) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onStatusChange,
  onViewInvoice,
  onPreviewInvoice,
}) => {
  return (
    <div style={{ padding: '16px 0', maxHeight: 500, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            <th style={{ textAlign: 'left', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Invoice No
            </th>
            <th style={{ textAlign: 'left', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Project
            </th>
            <th style={{ textAlign: 'left', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Client
            </th>
            <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Date
            </th>
            <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Total
            </th>
            <th style={{ textAlign: 'center', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Status
            </th>
            <th style={{ textAlign: 'center', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                No invoices found
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14 }}>
                  {invoice.invoice_no}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14 }}>
                  {invoice.project_name || '-'}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14 }}>
                  {invoice.clients?.name || '-'}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {invoice.invoice_date}
                </td>
                <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                  {Number(invoice.total).toLocaleString(CURRENCY_LOCALE, {
                    style: 'currency',
                    currency: CURRENCY,
                    minimumFractionDigits: 0,
                  })}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'center' }}>
                  <select
                    value={invoice.status}
                    onChange={(e) => onStatusChange(invoice.id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background:
                        invoice.status === 'paid'
                          ? '#065f46'
                          : invoice.status === 'sent'
                          ? '#1e40af'
                          : '#374151',
                      color: '#e5e7eb',
                      border: '1px solid #374151',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="draft" style={{ background: '#020617', color: '#e5e7eb' }}>
                      draft
                    </option>
                    <option value="sent" style={{ background: '#020617', color: '#e5e7eb' }}>
                      sent
                    </option>
                    <option value="paid" style={{ background: '#020617', color: '#e5e7eb' }}>
                      paid
                    </option>
                    <option value="cancelled" style={{ background: '#020617', color: '#e5e7eb' }}>
                      cancelled
                    </option>
                  </select>
                </td>
                <td style={{ padding: '12px 0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={() => onViewInvoice(invoice.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #38bdf8',
                        background: 'transparent',
                        color: '#38bdf8',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onPreviewInvoice(invoice.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #34d399',
                        background: 'transparent',
                        color: '#34d399',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
