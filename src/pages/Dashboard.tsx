import React, { useState, useEffect } from 'react';
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
import { useDashboardData } from '../hooks/useDashboardData';
import { InvoiceService } from '../services/invoice.service';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  StatCard,
  ChartCard,
  TimeRangeSelector,
  MaterialBreakdownTable,
  InvoicesTable,
} from '../components/dashboard';
import { ToastContainer, useToast } from '../components/Toast';
import { formatCurrency, formatNumber } from '../utils/format.utils';
import type { TimeRange } from '../types/dashboard.types';

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

const Dashboard: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [selectedMaterialInvoiceIds, setSelectedMaterialInvoiceIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const {
    loading,
    summary,
    timeSeries,
    categoryData,
    materialBreakdown,
    topClients,
    invoices,
    materialBreakdownTotals,
    loadMaterialsForInvoices,
    updateLocalInvoiceStatus,
    refetchData,
  } = useDashboardData(timeRange);

  useEffect(() => {
    if (selectedMaterialInvoiceIds.length > 0) {
      loadMaterialsForInvoices(selectedMaterialInvoiceIds);
    }
  }, [selectedMaterialInvoiceIds]);

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    updateLocalInvoiceStatus(invoiceId, newStatus);

    const success = await InvoiceService.updateInvoiceStatus(invoiceId, newStatus);
    if (success) {
      toast.success('Status Updated', `Invoice status changed to "${newStatus}".`);
      refetchData();
    } else {
      toast.error('Update Failed', 'Failed to update invoice status.');
      refetchData();
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.location.href = `/invoice/${invoiceId}`;
  };

  const handlePreviewInvoice = async (invoiceId: string) => {
    await InvoiceService.openPreviewWindow(invoiceId);
  };

  const handleDeleteInvoice = async (invoiceId: string, password: string): Promise<boolean> => {
    if (!user?.email || !password) {
      return false;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        return false;
      }

      const success = await InvoiceService.deleteInvoice(invoiceId);
      if (success) {
        toast.success('Invoice Deleted', 'The invoice has been permanently deleted.');
        refetchData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleBulkDeleteInvoices = async (invoiceIds: string[], password: string): Promise<boolean> => {
    if (!user?.email || !password || invoiceIds.length === 0) {
      return false;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        return false;
      }

      const { success, deletedCount } = await InvoiceService.bulkDeleteInvoices(invoiceIds);
      if (success) {
        toast.success(
          `${deletedCount} Invoice${deletedCount > 1 ? 's' : ''} Deleted`,
          `${deletedCount} invoice${deletedCount > 1 ? 's have' : ' has'} been permanently deleted.`
        );
        refetchData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e5e7eb',
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  const revenueChartData = {
    labels: timeSeries.map((d) => d.period),
    datasets: [
      {
        label: 'Revenue',
        data: timeSeries.map((d) => d.revenue),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const invoiceCountChartData = {
    labels: timeSeries.map((d) => d.period),
    datasets: [
      {
        label: 'Invoice Count',
        data: timeSeries.map((d) => d.invoiceCount),
        backgroundColor: '#38bdf8',
      },
    ],
  };

  const categoryChartData = {
    labels: categoryData.map((c) => c.category),
    datasets: [
      {
        data: categoryData.map((c) => c.revenue),
        backgroundColor: ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
      },
    ],
  };

  const clientChartData = {
    labels: topClients.map((c) => c.client_name),
    datasets: [
      {
        label: 'Revenue',
        data: topClients.map((c) => c.total_revenue),
        backgroundColor: '#34d399',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e5e7eb' } },
    },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
    },
  };

  const filteredInvoicesBySearch = invoices.filter((invoice) => {
    const matchesSearch = !searchTerm ||
      invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client_name || invoice.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : null;
    const matchesDateFrom = !dateFrom || (invoiceDate && invoiceDate >= new Date(dateFrom));
    const matchesDateTo = !dateTo || (invoiceDate && invoiceDate <= new Date(dateTo));

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        padding: '40px 20px',
      }}
    >
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ margin: 0, color: '#e5e7eb', fontSize: 32, fontWeight: 700 }}>
            Dashboard Analytics
          </h1>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by customer name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1 1 300px',
              padding: '10px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
          {(searchTerm || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
              }}
              style={{
                padding: '10px 16px',
                background: '#334155',
                border: 'none',
                borderRadius: 8,
                color: '#e5e7eb',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        <h3 style={{ margin: '0 0 12px 0', color: '#9ca3af', fontSize: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Financial Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="Total Sales"
            value={formatCurrency(summary?.totalRevenue || 0)}
            color="#6b7280"
          />
          <StatCard
            title="Total Costing"
            value={formatCurrency(summary?.totalCosting || 0)}
            color="#ef4444"
          />
          <StatCard
            title="Profit Margin"
            value={formatCurrency(summary?.profitMargin || 0)}
            color="#22c55e"
          />
        </div>

        <h3 style={{ margin: '0 0 12px 0', color: '#9ca3af', fontSize: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Invoice Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="Total Invoices"
            value={formatNumber(summary?.totalInvoices || 0)}
            color="#38bdf8"
          />
          <StatCard
            title="Average Invoice"
            value={formatCurrency(summary?.avgInvoiceValue || 0)}
            color="#fbbf24"
          />
          <StatCard
            title="Items Sold"
            value={formatNumber(summary?.totalItemsSold || 0)}
            color="#a78bfa"
          />
        </div>

        <h3 style={{ margin: '0 0 12px 0', color: '#9ca3af', fontSize: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Invoice Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="Draft Invoices"
            value={formatNumber(summary?.draftCount || 0)}
            subtitle="Pending"
            color="#9ca3af"
          />
          <StatCard
            title="Sent Invoices"
            value={formatNumber(summary?.sentCount || 0)}
            subtitle="Awaiting payment"
            color="#60a5fa"
          />
          <StatCard
            title="Paid Invoices"
            value={formatNumber(summary?.paidCount || 0)}
            subtitle="Completed"
            color="#34d399"
          />
        </div>

        <div style={{ height: 2, background: '#334155', marginBottom: 24 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Revenue Over Time">
            <div style={{ height: 300 }}>
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </ChartCard>

          <ChartCard title="Invoice Count">
            <div style={{ height: 300 }}>
              <Bar data={invoiceCountChartData} options={chartOptions} />
            </div>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Revenue by Category">
            <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={categoryChartData}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e5e7eb' } } } }}
              />
            </div>
          </ChartCard>

          <ChartCard title="Top 5 Clients">
            <div style={{ height: 300 }}>
              <Bar data={clientChartData} options={chartOptions} />
            </div>
          </ChartCard>
        </div>

        <div style={{ height: 2, background: '#334155', marginBottom: 24 }} />

        <ChartCard title="Material Breakdown (Detailed)" style={{ marginTop: 16 }}>
          <MaterialBreakdownTable
            materials={materialBreakdown}
            invoices={filteredInvoicesBySearch}
            selectedInvoiceIds={selectedMaterialInvoiceIds}
            onInvoiceSelect={setSelectedMaterialInvoiceIds}
          />
        </ChartCard>

        <div style={{ height: 2, background: '#334155', marginTop: 24, marginBottom: 24 }} />

        <ChartCard title="All Invoices" style={{ marginTop: 16 }}>
          <InvoicesTable
            invoices={filteredInvoicesBySearch}
            materialBreakdownTotals={materialBreakdownTotals}
            onStatusChange={handleStatusChange}
            onViewInvoice={handleViewInvoice}
            onPreviewInvoice={handlePreviewInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onBulkDeleteInvoices={handleBulkDeleteInvoices}
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
