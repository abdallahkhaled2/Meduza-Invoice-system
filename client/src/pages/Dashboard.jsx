const React = require('react');
const { useEffect, useState } = React;
const KpiCard = require('../components/KpiCard');
const TopItemsTable = require('../components/TopItemsTable');

const { Line, Bar, Doughnut } = require('react-chartjs-2');
const Chart = require('chart.js/auto');

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch('/api/analytics/summary').then(r => r.json()),
          fetch('/api/analytics/timeseries?interval=daily').then(r => r.json()),
        ]);
        if (!mounted) return;
        setSummary(sRes);
        setTimeseries(tRes);
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return React.createElement('div', null, 'Loading dashboard...');
  if (!summary) return React.createElement('div', null, 'No analytics available.');

  const revenueSeries = timeseries.map(t => t.revenue);
  const categories = timeseries.map(t => t.period);

  const lineData = {
    labels: categories,
    datasets: [
      {
        label: 'Revenue',
        data: revenueSeries,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.2,
      },
    ],
  };

  const topItems = summary.topItems || [];
  const topItemNames = topItems.map(i => i.name || `#${i.item_id}`);
  const topItemQtys = topItems.map(i => i.qty);

  const barData = {
    labels: topItemNames,
    datasets: [
      {
        label: 'Qty',
        data: topItemQtys,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const revenueByCategory = summary.revenueByCategory || [];
  const donutData = {
    labels: revenueByCategory.map(r => r.category || 'Uncategorized'),
    datasets: [{ data: revenueByCategory.map(r => r.revenue), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }],
  };

  return (
    React.createElement('div', { style: { padding: 16 } },
      React.createElement('h2', null, 'Dashboard'),

      React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 } },
        React.createElement(KpiCard, { title: 'Total Revenue', value: summary.totalRevenue.toFixed ? summary.totalRevenue.toFixed(2) : summary.totalRevenue }),
        React.createElement(KpiCard, { title: 'Total Invoices', value: summary.totalInvoices }),
        React.createElement(KpiCard, { title: 'Avg Invoice', value: summary.avgInvoiceValue.toFixed ? summary.avgInvoiceValue.toFixed(2) : summary.avgInvoiceValue }),
        React.createElement(KpiCard, { title: 'Unpaid Invoices', value: summary.unpaidCount }),
      ),

      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 } },
        React.createElement('div', { style: { background: '#fff', padding: 12, borderRadius: 8 } },
          React.createElement('h4', null, 'Revenue over time'),
          React.createElement(Line, { data: lineData }),
        ),

        React.createElement('div', { style: { background: '#fff', padding: 12, borderRadius: 8 } },
          React.createElement('h4', null, 'Revenue by category'),
          React.createElement(Doughnut, { data: donutData }),
        ),
      ),

      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 } },
        React.createElement('div', { style: { background: '#fff', padding: 12, borderRadius: 8 } },
          React.createElement('h4', null, 'Top items (by revenue)'),
          React.createElement(TopItemsTable, { items: topItems }),
        ),

        React.createElement('div', { style: { background: '#fff', padding: 12, borderRadius: 8 } },
          React.createElement('h4', null, 'Top items (by quantity)'),
          React.createElement(Bar, { data: barData }),
        ),
      ),
    )
  );
}

module.exports = Dashboard;
