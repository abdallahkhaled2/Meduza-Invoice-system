import React, { useEffect, useState } from 'react';
import './App.css';
import type {
  CompanyInfo,
  ClientInfo,
  InvoiceMeta,
  InvoiceItem,
  InvoicePayload,
  MaterialRow,
} from './types';

type PreviewData = InvoicePayload;

const emptyCompany: CompanyInfo = {
  name: '',
  logoUrl: '/Company%20Logo.svg',
  address: '',
  phone: '',
  email: '',
};

const emptyClient: ClientInfo = {
  name: '',
  company: '',
  address: '',
  phone: '',
  email: '',
  siteAddress: '',
};

const emptyMeta: InvoiceMeta = {
  invoiceNo: '',
  date: '',
  dueDate: '',
  projectName: '',
};

const InvoicePreview: React.FC = () => {
  const [data, setData] = useState<PreviewData>({
    company: emptyCompany,
    client: emptyClient,
    meta: emptyMeta,
    items: [],
    vatRate: 0,
    discount: 0,
    notes: '',
  });

  useEffect(() => {
    const loadData = () => {
      try {
        const draft = localStorage.getItem('invoice-draft');
        const preview = localStorage.getItem('invoice-preview');

        const raw = preview || draft;
        if (!raw) return;

        const parsed: PreviewData = JSON.parse(raw);
        setData(parsed);
      } catch (err) {
        console.error('Failed to load invoice data from localStorage', err);
      }
    };

    loadData();

    const interval = setInterval(loadData, 500);

    return () => clearInterval(interval);
  }, []);

  const { company, client, meta, items, vatRate, discount, notes } = data;

  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const taxableAmount = Math.max(subtotal - discount, 0);
  const vatAmount = (taxableAmount * vatRate) / 100;
  const total = taxableAmount + vatAmount;

  /* ================= HANDLERS ================= */

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    // حالياً بنستخدم print برضه – ممكن بعدين نضيف jsPDF
    window.print();
  };

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const hasAnyMaterials = items.some(
      (it) => it.materials && it.materials.length > 0
    );
    if (!hasAnyMaterials) {
      alert('No material breakdown found on items.');
      return;
    }

    const lines: string[] = [];

    // عنوان الأعمدة
    lines.push(
      [
        'Invoice No',
        'Project',
        'Client',
        'Item #',
        'Item Name',
        'Category',
        'Material',
        'Unit',
        'Qty per Item',
        'Item Qty',
        'Total Material Qty',
      ]
        .map(escapeCsv)
        .join(',')
    );

    items.forEach((item: InvoiceItem, index) => {
      if (!item.materials || item.materials.length === 0) return;

      item.materials.forEach((m: MaterialRow) => {
        const totalMatQty = m.qty * item.qty;

        lines.push(
          [
            meta.invoiceNo || '',
            meta.projectName || '',
            client.name || '',
            index + 1,
            item.code || 'Item',
            item.category,
            m.name,
            m.unit,
            m.qty,
            item.qty,
            totalMatQty,
          ]
            .map(escapeCsv)
            .join(',')
        );
      });
    });

    const csvContent = lines.join('\r\n');
    const fileName = meta.invoiceNo
      ? `${meta.invoiceNo}_materials.csv`
      : 'invoice-materials.csv';

    downloadCsv(fileName, csvContent);
  };

  // إظهار / إخفاء صفوف التوتال
  const showDiscountRow = discount > 0;
  const showVatRow = vatRate > 0 && vatAmount > 0;
  const showSubtotalRow = showDiscountRow || showVatRow;
  const showTaxableRow = showDiscountRow || showVatRow;

  /* ================= RENDER ================= */

  return (
    <div className="invoice-preview-root">
      {/* شريط الأزرار فوق */}
      <div className="invoice-toolbar no-print">
        <button className="btn-outline" onClick={handlePrint}>
          Print Invoice
        </button>
        <button className="btn-outline" onClick={handleExportPdf}>
          Export PDF
        </button>
        <button className="btn-outline" onClick={handleExportExcel}>
          Export Excel
        </button>
      </div>

      {/* صفحة الفاتورة نفسها */}
      <div className="invoice-page">
        {/* ===== HEADER ===== */}
        <header className="invoice-header">
          {/* الشمال: اللوجو + بيانات الشركة */}
          <div className="header-left">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt="Company logo"
                className="company-logo"
              />
            )}
            <div>
              <div className="company-name">
                {company.name || 'Company Name'}
              </div>
              <div className="small-text">
                {company.address && <span>{company.address}</span>}
              </div>
              <div className="small-text">
                {company.phone && <span>{company.phone}</span>}
                {company.phone && company.email && ' · '}
                {company.email && (
                  <span className="email-line">{company.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* اليمين: بيانات الفاتورة + العميل */}
          <div className="header-right">
            <div className="invoice-meta-block">
              <div className="invoice-title">INVOICE</div>
              <div className="small-text">
                <strong>Invoice No:</strong> {meta.invoiceNo || '-'}
              </div>
              <div className="small-text">
                <strong>Date:</strong> {meta.date || '-'}
              </div>
              <div className="small-text">
                <strong>Project:</strong> {meta.projectName || '-'}
              </div>
            </div>

            <div className="client-block">
              <div className="section-label">BILL TO</div>
              <div className="small-text bold">
                {client.name || 'Client Name'}
              </div>
              {client.address && (
                <div className="small-text">{client.address}</div>
              )}
              {(client.phone || client.email) && (
                <div className="small-text">
                  {client.phone && <span>Tel: {client.phone}</span>}
                  {client.phone && client.email && ' · '}
                  {client.email && <span>{client.email}</span>}
                </div>
              )}
              {client.siteAddress && (
                <div className="small-text" style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 10 }}>
                    Site / Delivery:
                  </span>{' '}
                  {client.siteAddress}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===== ITEMS TABLE ===== */}
        <section className="invoice-items">
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="col-item">Item</th>
                <th className="col-material">Material / Finish</th>
                <th className="col-dimensions">Dimensions</th>
                <th className="col-photo">Photo</th>
                <th className="col-qty">Qty</th>
                <th className="col-unit">Unit</th>
                <th className="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                    No items.
                  </td>
                </tr>
              )}
              {items.map((item: InvoiceItem, index: number) => {
                const lineTotal = item.qty * item.unitPrice;
                return (
                  <tr key={item.id ?? index}>
                    <td className="col-index">{index + 1}</td>
                    <td className="col-item">
                      <div className="item-name">{item.code || 'Item'}</div>
                    </td>
                    <td className="col-material">
                      <div className="small-text">
                        {item.description || '-'}
                      </div>
                    </td>
                    <td className="col-dimensions">
                      <div className="small-text">{item.dimensions || '-'}</div>
                    </td>
                    <td className="col-photo">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt="Item"
                          className="table-photo"
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="col-qty">{item.qty}</td>
                    <td className="col-unit">
                      {item.unitPrice.toLocaleString('en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="col-total">
                      {lineTotal.toLocaleString('en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ===== TOTALS ===== */}
        <section className="invoice-totals">
          <div className="totals-box">
            {showSubtotalRow && (
              <div className="totals-row">
                <span>Subtotal</span>
                <span>
                  {subtotal.toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {showDiscountRow && (
              <div className="totals-row">
                <span>Discount</span>
                <span>
                  {discount.toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {showTaxableRow && (
              <div className="totals-row">
                <span>Taxable Amount</span>
                <span>
                  {taxableAmount.toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {showVatRow && (
              <div className="totals-row">
                <span>VAT ({vatRate}%)</span>
                <span>
                  {vatAmount.toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <div className="totals-row totals-row-strong">
              <span>Grand Total</span>
              <span>
                {total.toLocaleString('en-EG', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </section>

        {/* ===== NOTES ===== */}
        <section className="invoice-notes">
          <div className="section-label">NOTES / TERMS</div>
          <pre className="notes-text">{notes}</pre>
        </section>

        {/* ===== FOOTER ===== */}
        <section className="invoice-footer">
          <div className="footer-line">Prepared By: ______________________</div>
          <div className="footer-line">Approved By: ______________________</div>
          <div className="thankyou">Thank you for your business.</div>
        </section>
      </div>
    </div>
  );
};

export default InvoicePreview;
