export type TimeRange = '7days' | '30days' | '90days' | 'all';

export interface AnalyticsSummary {
  totalInvoices: number;
  totalRevenue: number;
  avgInvoiceValue: number;
  totalItemsSold: number;
  draftCount: number;
  paidCount: number;
  sentCount: number;
}

export interface TimeSeriesData {
  period: string;
  invoiceCount: number;
  revenue: number;
}

export interface CategoryData {
  category: string;
  itemCount: number;
  revenue: number;
}

export interface MaterialBreakdown {
  material_name: string;
  total_qty: number;
  unit: string;
  usage_count: number;
  unit_cost: number;
  total_cost: number;
}

export interface TopClient {
  client_name: string;
  invoice_count: number;
  total_revenue: number;
}
