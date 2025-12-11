import React, { useState, useMemo } from 'react';
import type { Invoice } from '../../types/invoice.types';
import { CURRENCY, CURRENCY_LOCALE } from '../../constants/company.constants';
import { escapeCSV, downloadCSV } from '../../utils/export.utils';

interface InvoicesTableProps {
  invoices: Invoice[];
  materialBreakdownTotals: Map<string, number>;
  onStatusChange: (invoiceId: string, status: string) => void;
  onViewInvoice: (invoiceId: string) => void;
  onPreviewInvoice: (invoiceId: string) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  materialBreakdownTotals,
  onStatusChange,
  onViewInvoice,
  onPreviewInvoice,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchTerm ||
        invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.project_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateFrom = !dateFrom || invoice.invoice_date >= dateFrom;
      const matchesDateTo = !dateTo || invoice.invoice_date <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [invoices, searchTerm, dateFrom, dateTo]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleExportSelected = () => {
    const invoicesToExport =
      selectedIds.size > 0
        ? invoices.filter((inv) => selectedIds.has(inv.id))
        : filteredInvoices;

    if (invoicesToExport.length === 0) {
      alert('No invoices to export');
      return;
    }

    const lines: string[] = [];
    lines.push(
      [
        'Invoice No.',
        'Invoice Date',
        'Customer Name',
        'Due Date',
        'Material Breakdown Total',
        'Selling Price (Invoice Total)',
        'Margin',
        'Status',
        'Order Class',
      ]
        .map(escapeCSV)
        .join(',')
    );

    invoicesToExport.forEach((invoice) => {
      const materialTotal = materialBreakdownTotals.get(invoice.id) || 0;
      const sellingPrice = Number(invoice.total);
      const margin = sellingPrice - materialTotal;

      lines.push(
        [
          invoice.invoice_no,
          invoice.invoice_date,
          invoice.clients?.name || '',
          invoice.due_date || '',
          materialTotal.toFixed(2),
          sellingPrice.toFixed(2),
          margin.toFixed(2),
          invoice.status,
          invoice.order_class || 'B2B',
        ]
          .map(escapeCSV)
          .join(',')
      );
    });

    const csvContent = lines.join('\r\n');
    const filename =
      selectedIds.size > 0
        ? `invoices-selected-${new Date().toISOString().split('T')[0]}.csv`
        : `invoices-all-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(filename, csvContent);
  };

  const allSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((inv) => selectedIds.has(inv.id));
  const someSelected = filteredInvoices.some((inv) => selectedIds.has(inv.id));

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
            Search (Invoice No., Customer, Project)
          </label>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
        </div>
        {(searchTerm || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
            }}
            style={{
              padding: '8px 16px',
              background: '#374151',
              border: 'none',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
        <button
          onClick={handleExportSelected}
          disabled={filteredInvoices.length === 0}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background:
              filteredInvoices.length === 0
                ? '#374151'
                : 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: filteredInvoices.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 6,
            color: '#38bdf8',
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{selectedIds.size} invoice(s) selected</span>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              padding: '4px 12px',
              background: 'transparent',
              border: '1px solid #38bdf8',
              borderRadius: 4,
              color: '#38bdf8',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div style={{ padding: '16px 0', maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              <th style={{ textAlign: 'left', padding: '8px', color: '#9ca3af', fontSize: 12, width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
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
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                  {invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={(e) => handleSelectOne(invoice.id, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
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
    </div>
  );
};
