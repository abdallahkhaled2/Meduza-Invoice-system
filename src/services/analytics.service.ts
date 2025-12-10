import { supabase } from '../lib/supabase';
import type {
  AnalyticsSummary,
  TimeSeriesData,
  CategoryData,
  MaterialBreakdown,
  TopClient,
  TimeRange,
} from '../types/dashboard.types';

export class AnalyticsService {
  static getDateFilter(timeRange: TimeRange): Date | null {
    const now = new Date();
    switch (timeRange) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return null;
    }
  }

  static async getSummary(timeRange: TimeRange): Promise<AnalyticsSummary> {
    const dateFilter = this.getDateFilter(timeRange);

    let invoiceQuery = supabase.from('invoices').select('total, status');
    if (dateFilter) {
      invoiceQuery = invoiceQuery.gte('invoice_date', dateFilter.toISOString().split('T')[0]);
    }

    const { data: invoices } = await invoiceQuery;

    let itemQuery = supabase.from('invoice_items').select('qty, invoice_id');
    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter.toISOString().split('T')[0]);
      const invoiceIds = filteredInvoices?.map((inv) => inv.id) || [];
      if (invoiceIds.length > 0) {
        itemQuery = itemQuery.in('invoice_id', invoiceIds);
      }
    }

    const { data: items } = await itemQuery;

    const totalInvoices = invoices?.length || 0;
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    const totalItemsSold = items?.reduce((sum, item) => sum + Number(item.qty || 0), 0) || 0;

    const draftCount = invoices?.filter((inv) => inv.status === 'draft').length || 0;
    const paidCount = invoices?.filter((inv) => inv.status === 'paid').length || 0;
    const sentCount = invoices?.filter((inv) => inv.status === 'sent').length || 0;

    return {
      totalInvoices,
      totalRevenue,
      avgInvoiceValue,
      totalItemsSold,
      draftCount,
      paidCount,
      sentCount,
    };
  }

  static async getTimeSeries(timeRange: TimeRange): Promise<TimeSeriesData[]> {
    const dateFilter = this.getDateFilter(timeRange);

    let query = supabase
      .from('invoices')
      .select('invoice_date, total')
      .order('invoice_date', { ascending: true });

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter.toISOString().split('T')[0]);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      return [];
    }

    const grouped: Record<string, { invoiceCount: number; revenue: number }> = {};

    data.forEach((inv) => {
      const period = inv.invoice_date;
      if (!grouped[period]) {
        grouped[period] = { invoiceCount: 0, revenue: 0 };
      }
      grouped[period].invoiceCount += 1;
      grouped[period].revenue += Number(inv.total || 0);
    });

    return Object.entries(grouped)
      .map(([period, values]) => ({
        period,
        invoiceCount: values.invoiceCount,
        revenue: values.revenue,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  static async getCategoryData(timeRange: TimeRange): Promise<CategoryData[]> {
    const dateFilter = this.getDateFilter(timeRange);

    let query = supabase
      .from('invoice_items')
      .select('category, qty, unit_price, invoice_id');

    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter.toISOString().split('T')[0]);

      const invoiceIds = filteredInvoices?.map((inv) => inv.id) || [];
      if (invoiceIds.length > 0) {
        query = query.in('invoice_id', invoiceIds);
      } else {
        return [];
      }
    }

    const { data } = await query;

    if (!data) {
      return [];
    }

    const grouped = data.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) {
        acc[cat] = { category: cat, itemCount: 0, revenue: 0 };
      }
      acc[cat].itemCount += Number(item.qty || 0);
      acc[cat].revenue += Number(item.qty || 0) * Number(item.unit_price || 0);
      return acc;
    }, {} as Record<string, CategoryData>);

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }

  static async getMaterialBreakdown(timeRange: TimeRange): Promise<MaterialBreakdown[]> {
    const dateFilter = this.getDateFilter(timeRange);

    let query = supabase
      .from('item_materials')
      .select('material_name, unit, total_qty, unit_cost, total_cost, invoice_item_id');

    if (dateFilter) {
      const { data: filteredInvoices } = await supabase
        .from('invoices')
        .select('id')
        .gte('invoice_date', dateFilter.toISOString().split('T')[0]);

      if (filteredInvoices && filteredInvoices.length > 0) {
        const invoiceIds = filteredInvoices.map((inv) => inv.id);

        const { data: items } = await supabase
          .from('invoice_items')
          .select('id')
          .in('invoice_id', invoiceIds);

        if (items && items.length > 0) {
          const itemIds = items.map((item) => item.id);
          query = query.in('invoice_item_id', itemIds);
        } else {
          return [];
        }
      } else {
        return [];
      }
    }

    const { data } = await query;

    if (!data) {
      return [];
    }

    const grouped = data.reduce((acc, mat) => {
      const key = `${mat.material_name}_${mat.unit}`;
      if (!acc[key]) {
        acc[key] = {
          material_name: mat.material_name,
          unit: mat.unit,
          total_qty: 0,
          usage_count: 0,
          unit_cost: Number(mat.unit_cost) || 0,
          total_cost: 0,
        };
      }
      acc[key].total_qty += Number(mat.total_qty);
      acc[key].total_cost += Number(mat.total_cost);
      acc[key].usage_count += 1;
      return acc;
    }, {} as Record<string, MaterialBreakdown>);

    return Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost).slice(0, 10);
  }

  static async getMaterialsForInvoice(invoiceId: string): Promise<MaterialBreakdown[]> {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('invoice_id', invoiceId);

    if (!items || items.length === 0) {
      return [];
    }

    const itemIds = items.map((item) => item.id);

    const { data } = await supabase
      .from('item_materials')
      .select('material_name, unit, total_qty, unit_cost, total_cost, invoice_item_id')
      .in('invoice_item_id', itemIds);

    if (!data) {
      return [];
    }

    const grouped = data.reduce((acc, mat) => {
      const key = `${mat.material_name}_${mat.unit}`;
      if (!acc[key]) {
        acc[key] = {
          material_name: mat.material_name,
          unit: mat.unit,
          total_qty: 0,
          usage_count: 0,
          unit_cost: Number(mat.unit_cost) || 0,
          total_cost: 0,
        };
      }
      acc[key].total_qty += Number(mat.total_qty);
      acc[key].total_cost += Number(mat.total_cost);
      acc[key].usage_count += 1;
      return acc;
    }, {} as Record<string, MaterialBreakdown>);

    return Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);
  }

  static async getTopClients(timeRange: TimeRange): Promise<TopClient[]> {
    const dateFilter = this.getDateFilter(timeRange);

    let query = supabase
      .from('invoices')
      .select('client_id, total, clients(name)');

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter.toISOString().split('T')[0]);
    }

    const { data } = await query;

    if (!data) {
      return [];
    }

    const grouped = data.reduce((acc, inv) => {
      const clients = inv.clients as any;
      const clientName = clients?.name || 'Unknown';
      if (!acc[clientName]) {
        acc[clientName] = { client_name: clientName, invoice_count: 0, total_revenue: 0 };
      }
      acc[clientName].invoice_count += 1;
      acc[clientName].total_revenue += Number(inv.total || 0);
      return acc;
    }, {} as Record<string, TopClient>);

    return Object.values(grouped).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5);
  }
}
