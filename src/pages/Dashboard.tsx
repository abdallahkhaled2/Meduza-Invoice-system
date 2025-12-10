import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getInvoiceDetails } from '../lib/invoiceService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type AnalyticsSummary = {
  totalInvoices: number;
  totalRevenue: number;
  avgInvoiceValue: number;
  totalItemsSold: number;
  draftCount: number;
  paidCount: number;
  sentCount: number;
};

type TimeSeriesData = {
  period: string;
  invoiceCount: number;
  revenue: number;
};

type CategoryData = {
  category: string;
  itemCount: number;
  revenue: number;
};

type MaterialBreakdown = {
  material_name: string;
  total_qty: number;
  unit: string;
  usage_count: number;
};

type TopClient = {
  client_name: string;
  invoice_count: number;
  total_revenue: number;
};

type Invoice = {
  id: string;
  invoice_no: string;
  project_name: string;
  invoice_date: string;
  total: number;
  status: string;
  clients: { name: string } | null;
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [materialBreakdown, setMaterialBreakdown] = useState<MaterialBreakdown[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadInvoicesList();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSummary(),
        loadTimeSeries(),
        loadCategoryData(),
        loadMaterialBreakdown(),
        loadTopClients(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const loadSummary = async () => {
    const dateFilter = getDateFilter();

    let invoicesQuery = supabase.from('invoices').select('total, status');
    if (dateFilter) {
      invoicesQuery = invoicesQuery.gte('invoice_date', dateFilter);
    }

    const { data: invoices } = await invoicesQuery;

    let itemsQuery = supabase.from('invoice_items').select('qty, invoice_id');
    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter);

      const invoiceIds = filteredInvoices?.map(inv => inv.id) || [];
      if (invoiceIds.length > 0) {
        itemsQuery = itemsQuery.in('invoice_id', invoiceIds);
      }
    }

    const { data: items } = await itemsQuery;

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
    const totalInvoices = invoices?.length || 0;
    const totalItemsSold = items?.reduce((sum, item) => sum + Number(item.qty), 0) || 0;

    const draftCount = invoices?.filter(inv => inv.status === 'draft').length || 0;
    const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0;
    const sentCount = invoices?.filter(inv => inv.status === 'sent').length || 0;

    setSummary({
      totalInvoices,
      totalRevenue,
      avgInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
      totalItemsSold,
      draftCount,
      paidCount,
      sentCount,
    });
  };

  const loadTimeSeries = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('invoices')
      .select('invoice_date, total');

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter);
    }

    const { data } = await query.order('invoice_date', { ascending: true });

    if (!data) {
      setTimeSeries([]);
      return;
    }

    const grouped = data.reduce((acc, invoice) => {
      const date = invoice.invoice_date;
      if (!acc[date]) {
        acc[date] = { period: date, invoiceCount: 0, revenue: 0 };
      }
      acc[date].invoiceCount += 1;
      acc[date].revenue += Number(invoice.total);
      return acc;
    }, {} as Record<string, TimeSeriesData>);

    setTimeSeries(Object.values(grouped));
  };

  const loadCategoryData = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('invoice_items')
      .select('category, qty, unit_price, invoice_id');

    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter);

      const invoiceIds = filteredInvoices?.map(inv => inv.id) || [];
      if (invoiceIds.length > 0) {
        query = query.in('invoice_id', invoiceIds);
      }
    }

    const { data } = await query;

    if (!data) {
      setCategoryData([]);
      return;
    }

    const grouped = data.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = { category: cat, itemCount: 0, revenue: 0 };
      }
      acc[cat].itemCount += Number(item.qty);
      acc[cat].revenue += Number(item.qty) * Number(item.unit_price);
      return acc;
    }, {} as Record<string, CategoryData>);

    setCategoryData(Object.values(grouped).sort((a, b) => b.revenue - a.revenue));
  };

  const loadMaterialBreakdown = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('item_materials')
      .select('material_name, unit, total_qty, invoice_item_id');

    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter);

      const invoiceIds = filteredInvoices?.map(inv => inv.id) || [];

      if (invoiceIds.length > 0) {
        const { data: items } = await supabase
          .from('invoice_items')
          .select('id')
          .in('invoice_id', invoiceIds);

        const itemIds = items?.map(item => item.id) || [];
        if (itemIds.length > 0) {
          query = query.in('invoice_item_id', itemIds);
        }
      }
    }

    const { data } = await query;

    if (!data) {
      setMaterialBreakdown([]);
      return;
    }

    const grouped = data.reduce((acc, mat) => {
      const key = `${mat.material_name}_${mat.unit}`;
      if (!acc[key]) {
        acc[key] = {
          material_name: mat.material_name,
          unit: mat.unit,
          total_qty: 0,
          usage_count: 0,
        };
      }
      acc[key].total_qty += Number(mat.total_qty);
      acc[key].usage_count += 1;
      return acc;
    }, {} as Record<string, MaterialBreakdown>);

    setMaterialBreakdown(
      Object.values(grouped).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10)
    );
  };

  const loadTopClients = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('invoices')
      .select('client_id, total, clients(name)');

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter);
    }

    const { data } = await query;

    if (!data) {
      setTopClients([]);
      return;
    }

    const grouped = data.reduce((acc, invoice: any) => {
      const clientName = invoice.clients?.name || 'Unknown';
      if (!acc[clientName]) {
        acc[clientName] = {
          client_name: clientName,
          invoice_count: 0,
          total_revenue: 0,
        };
      }
      acc[clientName].invoice_count += 1;
      acc[clientName].total_revenue += Number(invoice.total);
      return acc;
    }, {} as Record<string, TopClient>);

    setTopClients(
      Object.values(grouped).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5)
    );
  };

  const loadInvoicesList = async () => {
    const dateFilter = getDateFilter();

    let query = supabase
      .from('invoices')
      .select('id, invoice_no, project_name, invoice_date, total, status, clients(name)')
      .order('invoice_date', { ascending: false });

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter);
    }

    const { data } = await query;
    const mappedData = (data || []).map((item: any) => ({
      ...item,
      clients: Array.isArray(item.clients) ? item.clients[0] : item.clients,
    }));
    setInvoices(mappedData as Invoice[]);
  };

  const handleViewInvoice = async (invoiceId: string) => {
    const result = await getInvoiceDetails(invoiceId);
    if (result.success) {
      setSelectedInvoice(result.data);
      setShowInvoiceModal(true);
    } else {
      alert('Failed to load invoice details');
    }
  };

  const handleCloseModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#9ca3af' }}>Loading dashboard...</div>
      </div>
    );
  }

  const revenueChartData = {
    labels: timeSeries.map(d => d.period),
    datasets: [
      {
        label: 'Revenue (EGP)',
        data: timeSeries.map(d => d.revenue),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const categoryChartData = {
    labels: categoryData.map(d => d.category),
    datasets: [
      {
        label: 'Items Sold',
        data: categoryData.map(d => d.itemCount),
        backgroundColor: [
          '#38bdf8',
          '#818cf8',
          '#a78bfa',
          '#f472b6',
          '#fb923c',
          '#fbbf24',
          '#34d399',
          '#4ade80',
        ],
      },
    ],
  };

  const materialChartData = {
    labels: materialBreakdown.map(m => m.material_name),
    datasets: [
      {
        label: 'Total Quantity',
        data: materialBreakdown.map(m => m.total_qty),
        backgroundColor: 'rgba(56, 189, 248, 0.6)',
      },
    ],
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #020617 0%, #020617 40%, #000 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#e5e7eb',
            margin: 0,
          }}>
            Analytics Dashboard
          </h1>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['7days', '30days', '90days', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: timeRange === range ? '1px solid #38bdf8' : '1px solid #374151',
                  background: timeRange === range ? '#38bdf8' : '#020617',
                  color: timeRange === range ? '#020617' : '#e5e7eb',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {range === 'all' ? 'All Time' : range.replace('days', ' Days')}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          <KpiCard
            title="Total Revenue"
            value={`${summary?.totalRevenue.toLocaleString('en-EG', {
              style: 'currency',
              currency: 'EGP',
              minimumFractionDigits: 0,
            })}`}
            subtitle={`${summary?.totalInvoices} invoices`}
          />
          <KpiCard
            title="Average Invoice"
            value={`${summary?.avgInvoiceValue.toLocaleString('en-EG', {
              style: 'currency',
              currency: 'EGP',
              minimumFractionDigits: 0,
            })}`}
            subtitle="per invoice"
          />
          <KpiCard
            title="Items Sold"
            value={summary?.totalItemsSold.toString() || '0'}
            subtitle="total units"
          />
          <KpiCard
            title="Paid Invoices"
            value={`${summary?.paidCount}/${summary?.totalInvoices}`}
            subtitle={`${summary?.draftCount} drafts, ${summary?.sentCount} sent`}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          <ChartCard title="Revenue Over Time">
            {timeSeries.length > 0 ? (
              <Line data={revenueChartData} options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }} />
            ) : (
              <EmptyState message="No invoice data available" />
            )}
          </ChartCard>

          <ChartCard title="Items by Category">
            {categoryData.length > 0 ? (
              <Doughnut data={categoryChartData} options={{
                responsive: true,
                plugins: { legend: { position: 'right' } },
              }} />
            ) : (
              <EmptyState message="No category data available" />
            )}
          </ChartCard>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: 16,
        }}>
          <ChartCard title="Top Materials Used">
            {materialBreakdown.length > 0 ? (
              <Bar data={materialChartData} options={{
                responsive: true,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
              }} />
            ) : (
              <EmptyState message="No material data available" />
            )}
          </ChartCard>

          <ChartCard title="Top Clients">
            {topClients.length > 0 ? (
              <div style={{ padding: '16px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                        Client
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                        Invoices
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#9ca3af', fontSize: 12 }}>
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14 }}>
                          {client.client_name}
                        </td>
                        <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                          {client.invoice_count}
                        </td>
                        <td style={{ padding: '12px 0', color: '#e5e7eb', fontSize: 14, textAlign: 'right' }}>
                          {client.total_revenue.toLocaleString('en-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No client data available" />
            )}
          </ChartCard>
        </div>

        {materialBreakdown.length > 0 && (
          <ChartCard title="Material Breakdown (Detailed)" style={{ marginTop: 16 }}>
            <div style={{ padding: '16px 0' }}>
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
                      Used In
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materialBreakdown.map((material, idx) => (
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
                        {material.usage_count} items
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}

        <ChartCard title="All Invoices" style={{ marginTop: 16 }}>
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
                    Action
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
                        {Number(invoice.total).toLocaleString('en-EG', {
                          style: 'currency',
                          currency: 'EGP',
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          background: invoice.status === 'paid' ? '#065f46' : invoice.status === 'sent' ? '#1e40af' : '#374151',
                          color: '#e5e7eb',
                        }}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice.invoice}
          items={selectedInvoice.items}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; subtitle?: string }> = ({
  title,
  value,
  subtitle
}) => (
  <div style={{
    background: '#020617',
    border: '1px solid #1f2937',
    borderRadius: 12,
    padding: 20,
  }}>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: '#e5e7eb', marginBottom: 4 }}>
      {value}
    </div>
    {subtitle && <div style={{ fontSize: 11, color: '#6b7280' }}>{subtitle}</div>}
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  children,
  style,
}) => (
  <div style={{
    background: '#020617',
    border: '1px solid #1f2937',
    borderRadius: 12,
    padding: 20,
    ...style,
  }}>
    <h3 style={{
      fontSize: 16,
      fontWeight: 600,
      color: '#e5e7eb',
      marginTop: 0,
      marginBottom: 16,
    }}>
      {title}
    </h3>
    {children}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    padding: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  }}>
    {message}
  </div>
);

const InvoiceDetailsModal: React.FC<{
  invoice: any;
  items: any[];
  onClose: () => void;
}> = ({ invoice, items, onClose }) => {
  const calculateMaterialCost = (material: any, item: any) => {
    return material.qty_per_item * item.qty * (item.unit_price / item.qty);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#020617',
          border: '1px solid #1f2937',
          borderRadius: 12,
          padding: 32,
          maxWidth: 1000,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#e5e7eb',
            margin: 0,
          }}>
            Invoice Details: {invoice.invoice_no}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Client</div>
            <div style={{ fontSize: 14, color: '#e5e7eb' }}>{invoice.clients?.name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Project</div>
            <div style={{ fontSize: 14, color: '#e5e7eb' }}>{invoice.project_name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Date</div>
            <div style={{ fontSize: 14, color: '#e5e7eb' }}>{invoice.invoice_date}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 14, color: '#e5e7eb', textTransform: 'capitalize' }}>{invoice.status}</div>
          </div>
        </div>

        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#e5e7eb',
          marginTop: 24,
          marginBottom: 16,
        }}>
          Items & Materials Breakdown
        </h3>

        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              background: '#0f172a',
              border: '1px solid #1f2937',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#e5e7eb', marginBottom: 4 }}>
                  {idx + 1}. {item.code}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  {item.description} | {item.dimensions}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  Qty: {item.qty} × {Number(item.unit_price).toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                  })}
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#38bdf8' }}>
                  {Number(item.line_total).toLocaleString('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>

            {item.materials && item.materials.length > 0 && (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #1f2937',
              }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: 500 }}>
                  Materials Used:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1f2937' }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', color: '#6b7280', fontSize: 11 }}>
                        Material
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontSize: 11 }}>
                        Qty/Item
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontSize: 11 }}>
                        Unit
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontSize: 11 }}>
                        Total Qty
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontSize: 11 }}>
                        Est. Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.materials.map((mat: any, matIdx: number) => (
                      <tr key={matIdx} style={{ borderBottom: '1px solid #0f172a' }}>
                        <td style={{ padding: '8px 0', color: '#e5e7eb', fontSize: 13 }}>
                          {mat.material_name}
                        </td>
                        <td style={{ padding: '8px 0', color: '#e5e7eb', fontSize: 13, textAlign: 'right' }}>
                          {mat.qty_per_item}
                        </td>
                        <td style={{ padding: '8px 0', color: '#e5e7eb', fontSize: 13, textAlign: 'right' }}>
                          {mat.unit}
                        </td>
                        <td style={{ padding: '8px 0', color: '#e5e7eb', fontSize: 13, textAlign: 'right' }}>
                          {mat.total_qty}
                        </td>
                        <td style={{ padding: '8px 0', color: '#38bdf8', fontSize: 13, textAlign: 'right' }}>
                          {calculateMaterialCost(mat, item).toLocaleString('en-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        <div style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: '2px solid #1f2937',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 14, color: '#9ca3af' }}>Subtotal</span>
            <span style={{ fontSize: 14, color: '#e5e7eb' }}>
              {Number(invoice.subtotal).toLocaleString('en-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
              })}
            </span>
          </div>
          {invoice.discount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, color: '#9ca3af' }}>Discount</span>
              <span style={{ fontSize: 14, color: '#e5e7eb' }}>
                -{Number(invoice.discount).toLocaleString('en-EG', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
          {invoice.vat_rate > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, color: '#9ca3af' }}>VAT ({invoice.vat_rate}%)</span>
              <span style={{ fontSize: 14, color: '#e5e7eb' }}>
                {Number(invoice.vat_amount).toLocaleString('en-EG', {
                  style: 'currency',
                  currency: 'EGP',
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #1f2937',
          }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#e5e7eb' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#38bdf8' }}>
              {Number(invoice.total).toLocaleString('en-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
