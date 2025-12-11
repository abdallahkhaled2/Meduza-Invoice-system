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
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [selectedMaterialInvoiceId, setSelectedMaterialInvoiceId] = useState<string>('');

  const {
    loading,
    summary,
    timeSeries,
    categoryData,
    materialBreakdown,
    topClients,
    invoices,
    materialBreakdownTotals,
    loadMaterialsForInvoice,
    updateLocalInvoiceStatus,
    refetchData,
  } = useDashboardData(timeRange);

  useEffect(() => {
    if (selectedMaterialInvoiceId) {
      loadMaterialsForInvoice(selectedMaterialInvoiceId);
    }
  }, [selectedMaterialInvoiceId]);

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary?.totalRevenue || 0)}
            color="#38bdf8"
          />
          <StatCard
            title="Total Invoices"
            value={formatNumber(summary?.totalInvoices || 0)}
            color="#34d399"
          />
          <StatCard
            title="Average Invoice"
            value={formatCurrency(summary?.avgInvoiceValue || 0)}
            color="#fbbf24"
          />
          <StatCard
            title="Items Sold"
            value={formatNumber(summary?.totalItemsSold || 0)}
            color="#f87171"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
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

        <ChartCard title="Material Breakdown (Detailed)" style={{ marginTop: 16 }}>
          <MaterialBreakdownTable
            materials={materialBreakdown}
            invoices={invoices}
            selectedInvoiceId={selectedMaterialInvoiceId}
            onInvoiceSelect={setSelectedMaterialInvoiceId}
          />
        </ChartCard>

        <ChartCard title="All Invoices" style={{ marginTop: 16 }}>
          <InvoicesTable
            invoices={invoices}
            materialBreakdownTotals={materialBreakdownTotals}
            onStatusChange={handleStatusChange}
            onViewInvoice={handleViewInvoice}
            onPreviewInvoice={handlePreviewInvoice}
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
