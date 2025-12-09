This file explains how to integrate the new analytics endpoints and Dashboard UI added in the feature/dashboard-analytics branch.

1) Server
- Files added: server/db/knex.js, server/routes/analytics.js
- Install server dependencies:
  npm install knex pg
- Configure Postgres connection via environment variables. Example:
  DATABASE_URL=postgres://user:password@localhost:5432/mydb
  or set DB_CLIENT=pg and DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
- Mount the router in your server entry (e.g. server/index.js or src/index.js):
  const analyticsRouter = require('./routes/analytics');
  app.use('/api/analytics', analyticsRouter);
  Make sure the path aligns with where server is started.

2) Client
- Files added: client/src/pages/Dashboard.jsx, client/src/components/KpiCard.jsx, client/src/components/TopItemsTable.jsx
- Install client deps:
  npm install react-chartjs-2 chart.js
- Add a route to your React Router, for example:
  <Route path="/dashboard" element={<Dashboard/>} />
- Add a navigation link: <Link to="/dashboard">Dashboard</Link>

3) Database schema
The analytics queries assume these tables/columns exist (typical names):
- invoices: id, invoice_date (date or timestamptz), total (numeric), status (string)
- invoice_items: id, invoice_id, item_id, quantity (numeric), unit_price (numeric)
- items: id, name, category (string)

If your schema differs, update server/routes/analytics.js to match your column names.

4) Run & test
- Start server and client as you usually do. Visit /dashboard in the app.
- API endpoints:
  GET /api/analytics/summary
  GET /api/analytics/timeseries?interval=daily|monthly&from=YYYY-MM-DD&to=YYYY-MM-DD
