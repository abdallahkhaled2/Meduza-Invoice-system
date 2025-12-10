import { supabase } from './supabase';
import type { InvoicePayload, InvoiceItem } from '../types';

export const generateInvoiceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const { data: latestInvoice } = await supabase
    .from('invoices')
    .select('invoice_no')
    .like('invoice_no', `${prefix}%`)
    .order('invoice_no', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestInvoice) {
    const lastNumber = parseInt(latestInvoice.invoice_no.split('-')[2]);
    const nextNumber = lastNumber + 1;
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  return `${prefix}001`;
};

export const saveInvoice = async (payload: InvoicePayload) => {
  try {
    const { client, meta, items, vatRate, discount, notes } = payload;

    const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + item.qty * item.unitPrice, 0);
    const taxableAmount = Math.max(subtotal - discount, 0);
    const vatAmount = (taxableAmount * vatRate) / 100;
    const total = taxableAmount + vatAmount;

    let clientId: string | null = null;

    if (client.name || client.email) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', client.email)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: client.name,
            company: client.company,
            address: client.address,
            phone: client.phone,
            email: client.email,
            site_address: client.siteAddress,
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }
    }

    const invoiceNo = await generateInvoiceNumber();

    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_no: invoiceNo,
        client_id: clientId,
        project_name: meta.projectName,
        invoice_date: meta.date,
        due_date: meta.dueDate || null,
        subtotal,
        discount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        notes,
        status: 'draft',
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;
    const invoiceId = newInvoice.id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineTotal = item.qty * item.unitPrice;

      const { data: invoiceItem, error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceId,
          category: item.category,
          code: item.code,
          description: item.description,
          dimensions: item.dimensions,
          qty: item.qty,
          unit_price: item.unitPrice,
          line_total: lineTotal,
          image_url: item.image || null,
          sort_order: i,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      if (item.materials && item.materials.length > 0) {
        const materialsToInsert = item.materials.map((mat) => ({
          invoice_item_id: invoiceItem.id,
          material_name: mat.name,
          unit: mat.unit,
          qty_per_item: mat.qty,
          total_qty: mat.qty * item.qty,
        }));

        const { error: materialsError } = await supabase
          .from('item_materials')
          .insert(materialsToInsert);

        if (materialsError) throw materialsError;
      }
    }

    return { success: true, invoiceId, invoiceNo };
  } catch (error: any) {
    console.error('Error saving invoice:', error);
    console.error('Error details:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    });
    return { success: false, error };
  }
};

export const updateInvoiceStatus = async (invoiceId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { success: false, error };
  }
};

export const deleteInvoice = async (invoiceId: string) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error };
  }
};

export const getInvoiceDetails = async (invoiceId: string) => {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          company,
          address,
          phone,
          email
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order', { ascending: true });

    if (itemsError) throw itemsError;

    const itemsWithMaterials = await Promise.all(
      items.map(async (item) => {
        const { data: materials, error: materialsError } = await supabase
          .from('item_materials')
          .select('*')
          .eq('invoice_item_id', item.id);

        if (materialsError) throw materialsError;

        return {
          ...item,
          materials: materials || [],
        };
      })
    );

    return {
      success: true,
      data: {
        invoice,
        items: itemsWithMaterials,
      },
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return { success: false, error };
  }
};
