import { useState, useEffect } from 'react';
import { AnalyticsService } from '../services/analytics.service';
import { InvoiceService } from '../services/invoice.service';
import type {
  AnalyticsSummary,
  TimeSeriesData,
  CategoryData,
  MaterialBreakdown,
  TopClient,
  TimeRange,
} from '../types/dashboard.types';
import type { Invoice } from '../types/invoice.types';

export const useDashboardData = (timeRange: TimeRange) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [materialBreakdown, setMaterialBreakdown] = useState<MaterialBreakdown[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryData, timeSeriesData, categoryDataResult, materialData, clientsData] =
        await Promise.all([
          AnalyticsService.getSummary(timeRange),
          AnalyticsService.getTimeSeries(timeRange),
          AnalyticsService.getCategoryData(timeRange),
          AnalyticsService.getMaterialBreakdown(timeRange),
          AnalyticsService.getTopClients(timeRange),
        ]);

      setSummary(summaryData);
      setTimeSeries(timeSeriesData);
      setCategoryData(categoryDataResult);
      setMaterialBreakdown(materialData);
      setTopClients(clientsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const invoicesData = await InvoiceService.getInvoices(timeRange);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadMaterialsForInvoice = async (invoiceId: string) => {
    try {
      const materials = await AnalyticsService.getMaterialsForInvoice(invoiceId);
      setMaterialBreakdown(materials);
    } catch (error) {
      console.error('Error loading materials for invoice:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadInvoices();
  }, [timeRange]);

  return {
    loading,
    summary,
    timeSeries,
    categoryData,
    materialBreakdown,
    topClients,
    invoices,
    loadMaterialsForInvoice,
  };
};
