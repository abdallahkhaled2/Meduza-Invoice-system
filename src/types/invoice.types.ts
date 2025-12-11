export type ItemCategory =
  | 'Door'
  | 'Dining chair'
  | 'Arm chair'
  | 'Bar stool'
  | 'Bench'
  | 'Dining table'
  | 'Coffee table'
  | 'Side table'
  | 'Console table'
  | 'Sofa straight'
  | 'Sofa curved'
  | 'Cabinet'
  | 'Custom furniture';

export interface CompanyInfo {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
}

export interface ClientInfo {
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  siteAddress: string;
}

export interface InvoiceMeta {
  invoiceNo: string;
  date: string;
  dueDate: string;
  projectName: string;
  orderClass?: string;
}

export interface MaterialRow {
  name: string;
  unit: string;
  qty: number;
  cost: number;
}

export interface InvoiceItem {
  id: string | number;
  category: ItemCategory | string;
  code: string;
  description: string;
  dimensions: string;
  qty: number;
  unitPrice: number;
  image?: string;
  materials?: MaterialRow[];
}

export interface InvoicePayload {
  company: CompanyInfo;
  client: ClientInfo;
  meta: InvoiceMeta;
  items: InvoiceItem[];
  vatRate: number;
  discount: number;
  notes: string;
}

export interface InvoiceDetails {
  invoice: any;
  items: any[];
}

export interface Invoice {
  id: string;
  invoice_no: string;
  project_name: string;
  invoice_date: string;
  due_date?: string;
  total: number;
  status: string;
  order_class?: string;
  clients: { name: string } | null;
}
