const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

const isPg = () => (knex.client && knex.client.config && knex.client.config.client === 'pg');

router.get('/summary', async (req, res) => {
  try {
    const totalInvoicesRow = await knex('invoices').count('id as count').first();
    const totalInvoices = Number(totalInvoicesRow.count || 0);

    const totalRevenueRow = await knex('invoices').sum('total as sum').first();
    const totalRevenue = Number(totalRevenueRow.sum || 0);

    const avgRow = await knex('invoices').avg('total as avg').first();
    const avgInvoiceValue = Number(avgRow.avg || 0);

    const paidCountRow = await knex('invoices').count('* as count').where('status', 'paid').first();
    const unpaidCountRow = await knex('invoices').count('* as count').whereNot('status', 'paid').first();
    const paidCount = Number(paidCountRow.count || 0);
    const unpaidCount = Number(unpaidCountRow.count || 0);

    const topItems = await knex('invoice_items as ii')
      .select('ii.item_id', 'i.name')
      .sum({ qty: 'ii.quantity' })
      .sum({ revenue: knex.raw('ii.quantity * ii.unit_price') })
      .leftJoin('items as i', 'ii.item_id', 'i.id')
      .groupBy('ii.item_id', 'i.name')
      .orderBy('revenue', 'desc')
      .limit(10);

    const revenueByCategory = await knex('invoice_items as ii')
      .select('i.category')
      .sum({ revenue: knex.raw('ii.quantity * ii.unit_price') })
      .leftJoin('items as i', 'ii.item_id', 'i.id')
      .groupBy('i.category')
      .orderBy('revenue', 'desc');

    res.json({
      totalInvoices,
      totalRevenue,
      avgInvoiceValue,
      paidCount,
      unpaidCount,
      topItems,
      revenueByCategory,
    });
  } catch (err) {
    console.error('Analytics /summary error', err);
    res.status(500).json({ error: 'Failed to compute summary', details: err.message });
  }
});

router.get('/timeseries', async (req, res) => {
  try {
    const interval = (req.query.interval || 'daily').toLowerCase();
    const from = req.query.from;
    const to = req.query.to;

    let dateExpr;
    if (isPg()) {
      if (interval === 'monthly') {
        dateExpr = "to_char(date_trunc('month', invoices.invoice_date), 'YYYY-MM-01')";
      } else {
        dateExpr = "to_char(invoices.invoice_date::date, 'YYYY-MM-DD')";
      }
      const q = knex('invoices')
        .select(knex.raw(`${dateExpr} as period`))
        .count('id as invoicesCount')
        .sum('total as revenue')
        .groupBy('period')
        .orderBy('period');

      if (from) q.where('invoice_date', '>=', from);
      if (to) q.where('invoice_date', '<=', to);

      const rows = await q;
      res.json(rows.map(r => ({ period: r.period, invoicesCount: Number(r.invoicesCount), revenue: Number(r.revenue || 0) })));
      return;
    } else {
      if (interval === 'monthly') {
        dateExpr = "strftime('%Y-%m-01', invoice_date)";
      } else {
        dateExpr = "date(invoice_date)";
      }
      const q = knex('invoices')
        .select(knex.raw(`${dateExpr} as period`))
        .count('id as invoicesCount')
        .sum('total as revenue')
        .groupBy('period')
        .orderBy('period');

      if (from) q.where('invoice_date', '>=', from);
      if (to) q.where('invoice_date', '<=', to);

      const rows = await q;
      res.json(rows.map(r => ({ period: r.period, invoicesCount: Number(r.invoicesCount), revenue: Number(r.revenue || 0) })));
      return;
    }
  } catch (err) {
    console.error('Analytics /timeseries error', err);
    res.status(500).json({ error: 'Failed to compute timeseries', details: err.message });
  }
});

module.exports = router;
