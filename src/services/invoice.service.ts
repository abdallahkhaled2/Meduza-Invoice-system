import { supabase } from '../lib/supabase';
import { getInvoiceDetails } from '../lib/invoiceService';
import type { Invoice, InvoicePayload } from '../types/invoice.types';
import type { TimeRange } from '../types/dashboard.types';
import { COMPANY_INFO } from '../constants/company.constants';

export class InvoiceService {
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

  static async getInvoices(timeRange: TimeRange): Promise<Invoice[]> {
    const dateFilter = this.getDateFilter(timeRange);

    let query = supabase
      .from('invoices')
      .select('id, invoice_no, project_name, invoice_date, total, status, due_date, order_class, clients(name)')
      .order('invoice_date', { ascending: false });

    if (dateFilter) {
      query = query.gte('invoice_date', dateFilter.toISOString().split('T')[0]);
    }

    const { data } = await query;

    if (!data) return [];

    return data.map((inv: any) => ({
      ...inv,
      clients: inv.clients || null,
    })) as Invoice[];
  }

  static async updateInvoiceStatus(invoiceId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);

    return !error;
  }

  static async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('id')
        .eq('invoice_id', invoiceId);

      if (items && items.length > 0) {
        const itemIds = items.map((item) => item.id);

        await supabase
          .from('item_materials')
          .delete()
          .in('invoice_item_id', itemIds);

        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      return !error;
    } catch {
      return false;
    }
  }

  static async createPreviewPayload(invoiceId: string): Promise<InvoicePayload | null> {
    const result = await getInvoiceDetails(invoiceId);
    if (!result.success || !result.data) {
      return null;
    }

    const { invoice, items } = result.data;

    return {
      company: COMPANY_INFO,
      client: {
        name: invoice.clients?.name || 'Client Name',
        company: invoice.clients?.company || '',
        address: invoice.clients?.address || '',
        phone: invoice.clients?.phone || '',
        email: invoice.clients?.email || '',
        siteAddress: invoice.clients?.site_address || '',
      },
      meta: {
        invoiceNo: invoice.invoice_no || '',
        date: invoice.invoice_date || '',
        dueDate: invoice.due_date || '',
        projectName: invoice.project_name || '',
      },
      items: items.map((item: any) => ({
        id: item.id,
        category: item.category || 'Custom furniture',
        code: item.code || '',
        description: item.description || '',
        dimensions: item.dimensions || '',
        qty: item.qty || 1,
        unitPrice: Number(item.unit_price) || 0,
        image: item.image_url || undefined,
        materials: (item.materials || []).map((mat: any) => ({
          name: mat.material_name,
          unit: mat.unit,
          qty: mat.qty_per_item,
        })),
      })),
      vatRate: invoice.vat_rate || 0,
      discount: invoice.discount || 0,
      notes: invoice.notes || '',
    };
  }

  static async openPreviewWindow(invoiceId: string): Promise<void> {
    window.open(`/preview?standalone=true&invoiceId=${invoiceId}`, '_blank');
  }
}
