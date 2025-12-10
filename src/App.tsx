import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import './App.css';
import { saveInvoice as saveToDatabase } from './lib/invoiceService';

type MaterialRow = {
  name: string;
  unit: string;
  qty: number;
};

export type InvoiceItem = {
  id: number;
  category: ItemCategory;
  code: string;
  description: string;
  dimensions: string;
  qty: number;
  unitPrice: number;
  image?: string;
  materials?: MaterialRow[]; // ✅ دلوقتي النوع معروف
};

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

export type CompanyInfo = {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
};

export type ClientInfo = {
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  siteAddress: string;
};

export type InvoiceMeta = {
  invoiceNo: string;
  date: string;
  dueDate: string;
  projectName: string;
};

export type InvoicePayload = {
  company: CompanyInfo;
  client: ClientInfo;
  meta: InvoiceMeta;
  items: InvoiceItem[];
  vatRate: number;
  discount: number;
  notes: string;
};

type PricingConfig = {
  // Natural solid wood (EGP / m³)
  mouskiRate: number;
  zanRate: number;
  aroRate: number;
  beechPineRate: number;

  // MDF panels (EGP / sheet 122×244)
  mdf10RatePerSheet: number;
  mdf16RatePerSheet: number;
  mdf21RatePerSheet: number;

  // Blockboard (EGP / sheet 122×244)
  blockboard18RatePerSheet: number;

  // Veneer (EGP / m²)
  walnutVeneerRatePerM2: number;
  oakVeneerRatePerM2: number;
  beechVeneerRatePerM2: number;

  // HPL / LPL (EGP / sheet 122×244)
  hplRatePerSheet: number;
  lplRatePerSheet: number;

  // Finish types (EGP / m² / face)
  finishPuMatteRatePerM2: number;
  finishPuHighGlossRatePerM2: number;
  finishNcRatePerM2: number;
  finishOilRatePerM2: number;

  // Glass (EGP / m²)
  glass6RatePerM2: number;
  glass10RatePerM2: number;

  // Marble (EGP / m²)
  marbleRatePerM2: number;

  // Ply wood (EGP / sheet 122×244)
  ply25RatePerSheet: number;
  ply27RatePerSheet: number;
  ply8RatePerSheet: number;
  ply12RatePerSheet: number;
  ply18RatePerSheet: number;
  foamboardRatePerSheet: number; // ✅ جديد

  // Upholstery (chairs / benches) (EGP / piece)
  upholsterySeatOnly: number;
  upholsteryFull: number;
  upholsteryArmFull: number;

  // Labor (EGP / hour)
  laborRatePerHour: number;

  // Upholstery (sofas) – per meter
  upholsterySofaLowPerM: number;
  upholsterySofaHighPerM: number;

  // Fabric (EGP / meter)
  fabricLowRate: number;
  fabricHighRate: number;

  // Steel chassis (EGP / piece)
  steelChassisCostPerPiece: number;

  // Defaults
  defaultAccessories: number;
  defaultProfitMargin: number;

  // Compliance per item (general)
  compliancePerItem: number;

  drawerRunnerRate: number;
  doorHingeRate: number;
};

type CostResult = {
  price: number;
  description: string;
  dimensions: string;
  materials?: MaterialRow[]; // ✅ جديد
};

/* ================= MAIN APP ================= */

const App: React.FC = () => {
  // ===== Company ثابت =====
  const [company] = useState<CompanyInfo>({
    name: 'Meduza Studio Works',
    logoUrl: '/Company%20Logo.svg',
    address: 'Tolon, El Sayeda Zeinab, Cairo , Egypt',
    phone: '+20 1146700228 / +20 1018705558',
    email: 'info@meduzafurniture.com',
  });

  // ===== Client =====
  const [client, setClient] = useState<ClientInfo>({
    name: 'Client Name',
    company: 'Client Company',
    address: 'Client Billing Address',
    phone: '+20 100 000 0000',
    email: 'client@example.com',
    siteAddress: 'Site / Delivery Address',
  });

  // ===== Meta =====
  const [meta, setMeta] = useState<InvoiceMeta>({
    invoiceNo: 'INV-2025-001',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    projectName: 'Project Name',
  });

  // ===== Financial =====
  const [vatRate, setVatRate] = useState<number>(14);
  const [discount, setDiscount] = useState<number>(0);

  // ===== Items =====
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      category: 'Door',
      code: 'Solid door',
      description:
        'Wood: Mouski – Veneer: Oak veneer – Finish: PU matte – Fabric: none',
      dimensions: '220×90×4 cm',
      qty: 1,
      unitPrice: 8500,
    },
  ]);

  const [notes, setNotes] = useState<string>(
    '- Production lead time: 25–30 working days from advance payment.\n' +
      '- Delivery & installation inside Cairo & Giza are included.\n' +
      '- Colors and finishes may vary slightly due to natural wood characteristics.'
  );

  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    mouskiRate: 24000,
    zanRate: 36000,
    aroRate: 85000,
    beechPineRate: 78000,

    mdf10RatePerSheet: 650,
    mdf16RatePerSheet: 1050,
    mdf21RatePerSheet: 1350,

    blockboard18RatePerSheet: 1650,

    walnutVeneerRatePerM2: 310,
    oakVeneerRatePerM2: 210,
    beechVeneerRatePerM2: 210,

    hplRatePerSheet: 650,
    lplRatePerSheet: 350,

    finishPuMatteRatePerM2: 350,
    finishPuHighGlossRatePerM2: 420,
    finishNcRatePerM2: 280,
    finishOilRatePerM2: 250,

    glass6RatePerM2: 1350,
    glass10RatePerM2: 1750,

    marbleRatePerM2: 4500,

    ply25RatePerSheet: 200,
    ply27RatePerSheet: 390,
    ply8RatePerSheet: 1050,
    ply12RatePerSheet: 1450,
    ply18RatePerSheet: 2050,
    foamboardRatePerSheet: 2100, // ✅ جديد

    upholsterySeatOnly: 500,
    upholsteryFull: 700,
    upholsteryArmFull: 900,

    upholsterySofaLowPerM: 1250,
    upholsterySofaHighPerM: 1750,

    fabricLowRate: 220,
    fabricHighRate: 450,

    steelChassisCostPerPiece: 1500,

    laborRatePerHour: 160,

    defaultAccessories: 1500,
    drawerRunnerRate: 310,
    doorHingeRate: 89,
    defaultProfitMargin: 30,

    compliancePerItem: 80,
  });

  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // ===== Costing modals =====
  const [doorModalOpen, setDoorModalOpen] = useState(false);
  const [doorModalItemId, setDoorModalItemId] = useState<number | null>(null);

  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatModalItemId, setSeatModalItemId] = useState<number | null>(null);

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableModalItemId, setTableModalItemId] = useState<number | null>(null);

  const [sofaModalOpen, setSofaModalOpen] = useState(false);
  const [sofaModalItemId, setSofaModalItemId] = useState<number | null>(null);

  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [cabinetModalItemId, setCabinetModalItemId] = useState<number | null>(
    null
  );

  // ===== Handlers =====
  const updateItem = (id: number, field: keyof InvoiceItem, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'qty' || field === 'unitPrice'
                  ? Number(value || 0)
                  : value,
            }
          : item
      )
    );
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      category: 'Custom furniture',
      code: '',
      description: '',
      dimensions: '',
      qty: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const addTemplateItem = (category: ItemCategory) => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      category,
      code: category,
      description: '',
      dimensions: '',
      qty: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleImageUpload = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, image: reader.result as string } : item
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const buildPayload = (): InvoicePayload => ({
    company,
    client,
    meta,
    items,
    vatRate,
    discount,
    notes,
  });

  const handlePreview = () => {
    const payload = buildPayload();
    localStorage.setItem('invoice-preview', JSON.stringify(payload));
    window.open('/preview', '_blank', 'width=1024,height=1200');
  };

  const saveInvoice = () => {
    const payload = buildPayload();
    localStorage.setItem('saved-invoice', JSON.stringify(payload));
    alert('Invoice saved locally ✅');
  };

  const handleSaveToDatabase = async () => {
    const payload = buildPayload();
    const result = await saveToDatabase(payload);

    if (result.success) {
      alert('Invoice saved to database successfully! ✅\n\nView analytics in the Dashboard tab.');
      localStorage.setItem('invoice-preview', JSON.stringify(payload));
    } else {
      alert('Failed to save invoice to database. Check the browser console for details.');
      console.error('Save failed:', result.error);
    }
  };

  const loadInvoice = () => {
    const raw = localStorage.getItem('saved-invoice');
    if (!raw) {
      alert('No saved invoice found.');
      return;
    }
    try {
      const data: InvoicePayload = JSON.parse(raw);
      const fixedItems: InvoiceItem[] = data.items.map((it: any) => ({
        category: (it.category as ItemCategory) || 'Custom furniture',
        ...it,
      }));
      setClient(data.client);
      setMeta(data.meta);
      setItems(fixedItems);
      setVatRate(data.vatRate);
      setDiscount(data.discount);
      setNotes(data.notes);
    } catch {
      alert('Saved invoice is corrupted.');
    }
  };

  const handleApplyDoorPrice = (result: CostResult) => {
    if (!doorModalItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === doorModalItemId
          ? {
              ...item,
              unitPrice: Math.round(result.price),
              description: result.description,
              dimensions: result.dimensions,
            }
          : item
      )
    );
    setDoorModalOpen(false);
  };

  const handleApplySeatPrice = (result: CostResult) => {
    if (!seatModalItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === seatModalItemId
          ? {
              ...item,
              unitPrice: Math.round(result.price),
              description: result.description,
            }
          : item
      )
    );
    setSeatModalOpen(false);
  };

  const handleApplyCabinetPrice = (result: CostResult) => {
    if (!cabinetModalItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === cabinetModalItemId
          ? {
              ...item,
              unitPrice: Math.round(result.price),
              description: result.description,
              dimensions: result.dimensions || item.dimensions,
              materials: result.materials ?? item.materials,
            }
          : item
      )
    );
    setCabinetModalOpen(false);
  };

  const handleApplyTablePrice = (result: CostResult) => {
    if (!tableModalItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === tableModalItemId
          ? {
              ...item,
              unitPrice: Math.round(result.price),
              description: result.description,
              dimensions: result.dimensions || item.dimensions,
            }
          : item
      )
    );
    setTableModalOpen(false);
  };

  const handleApplySofaPrice = (result: CostResult) => {
    if (!sofaModalItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === sofaModalItemId
          ? {
              ...item,
              unitPrice: Math.round(result.price),
              description: result.description,
            }
          : item
      )
    );
    setSofaModalOpen(false);
  };

  const validateDimensions = (item: InvoiceItem) => {
    if (!item.dimensions || !item.dimensions.trim()) {
      alert('Please enter item dimensions first (H × W × T cm).');
      return false;
    }
    return true;
  };

  const openCosting = (item: InvoiceItem) => {
    if (!validateDimensions(item)) return;

    if (item.category === 'Door') {
      setDoorModalItemId(item.id);
      setDoorModalOpen(true);
    } else if (
      item.category === 'Dining chair' ||
      item.category === 'Arm chair' ||
      item.category === 'Bar stool' ||
      item.category === 'Bench'
    ) {
      setSeatModalItemId(item.id);
      setSeatModalOpen(true);
    } else if (
      item.category === 'Dining table' ||
      item.category === 'Coffee table' ||
      item.category === 'Side table' ||
      item.category === 'Console table'
    ) {
      setTableModalItemId(item.id);
      setTableModalOpen(true);
    } else if (
      item.category === 'Sofa straight' ||
      item.category === 'Sofa curved'
    ) {
      setSofaModalItemId(item.id);
      setSofaModalOpen(true);
    } else if (item.category === 'Cabinet') {
      setCabinetModalItemId(item.id);
      setCabinetModalOpen(true);
    } else {
      alert(
        'Costing is available for doors, seating, tables, sofas and cabinets.'
      );
    }
  };

  // ===== UI =====
  return (
    <div className="app">
      <div className="form-shell">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h1 className="app-title">Meduza Invoice Generator</h1>
          <button
            type="button"
            className="btn-outline"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setPricingModalOpen(true)}
          >
            Pricing Settings
          </button>
        </div>

        {/* Client */}
        <section className="card">
          <h2 className="card-title">Client Info</h2>
          <TextInput
            label="Client Name"
            value={client.name}
            onChange={(v) => setClient({ ...client, name: v })}
          />
          <TextInput
            label="Client Company"
            value={client.company}
            onChange={(v) => setClient({ ...client, company: v })}
          />
          <TextInput
            label="Billing Address"
            value={client.address}
            onChange={(v) => setClient({ ...client, address: v })}
          />
          <TextInput
            label="Phone"
            value={client.phone}
            onChange={(v) => setClient({ ...client, phone: v })}
          />
          <TextInput
            label="Email"
            value={client.email}
            onChange={(v) => setClient({ ...client, email: v })}
          />
          <TextInput
            label="Site / Delivery Address"
            value={client.siteAddress}
            onChange={(v) => setClient({ ...client, siteAddress: v })}
          />
        </section>

        {/* Invoice meta */}
        <section className="card">
          <h2 className="card-title">Invoice Details</h2>
          <TextInput
            label="Invoice No."
            value={meta.invoiceNo}
            onChange={(v) => setMeta({ ...meta, invoiceNo: v })}
          />
          <TextInput
            label="Date"
            type="date"
            value={meta.date}
            onChange={(v) => setMeta({ ...meta, date: v })}
          />
          <TextInput
            label="Due Date"
            type="date"
            value={meta.dueDate}
            onChange={(v) => setMeta({ ...meta, dueDate: v })}
          />
          <TextInput
            label="Project Name"
            value={meta.projectName}
            onChange={(v) => setMeta({ ...meta, projectName: v })}
          />
        </section>

        {/* Quick add templates */}
        <section className="card">
          <h2 className="card-title">Quick Add Items</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Dining chair')}
            >
              + Dining chair
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Arm chair')}
            >
              + Arm chair
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Bar stool')}
            >
              + Bar stool
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Bench')}
            >
              + Bench
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Dining table')}
            >
              + Dining table
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Cabinet')}
            >
              + Cabinet
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Coffee table')}
            >
              + Coffee table
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Side table')}
            >
              + Side table
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Console table')}
            >
              + Console table
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Sofa straight')}
            >
              + Sofa (straight)
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Sofa curved')}
            >
              + Sofa (curved)
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => addTemplateItem('Door')}
            >
              + Door
            </button>
          </div>
        </section>

        {/* Items */}
        <section className="card">
          <h2 className="card-title">Items</h2>
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-row">
                <label className="field">
                  <span className="field-label">Item Type</span>
                  <select
                    className="input"
                    value={item.category}
                    onChange={(e) =>
                      updateItem(item.id, 'category', e.target.value)
                    }
                  >
                    <option value="Door">Door</option>
                    <option value="Dining chair">Dining chair</option>
                    <option value="Arm chair">Arm chair</option>
                    <option value="Bar stool">Bar stool</option>
                    <option value="Bench">Bench</option>
                    <option value="Dining table">Dining table</option>
                    <option value="Cabinet">Cabinet</option>
                    <option value="Coffee table">Coffee table</option>
                    <option value="Side table">Side table</option>
                    <option value="Console table">Console table</option>
                    <option value="Sofa straight">Sofa straight</option>
                    <option value="Sofa curved">Sofa curved</option>
                    <option value="Custom furniture">Custom furniture</option>
                  </select>
                </label>
                <TextInput
                  label="Item Name (Invoice)"
                  value={item.code}
                  onChange={(v) => updateItem(item.id, 'code', v)}
                />
              </div>

              <div className="item-row">
                <TextInput
                  label="Dimensions (H × W × T cm)"
                  value={item.dimensions}
                  onChange={(v) => updateItem(item.id, 'dimensions', v)}
                />
                <TextInput
                  label="Qty"
                  type="number"
                  value={String(item.qty)}
                  onChange={(v) => updateItem(item.id, 'qty', v)}
                />
                <TextInput
                  label="Unit Price"
                  type="number"
                  value={String(item.unitPrice)}
                  onChange={(v) => updateItem(item.id, 'unitPrice', v)}
                />
              </div>

              <TextInput
                label="Description"
                value={item.description}
                onChange={(v) => updateItem(item.id, 'description', v)}
              />

              <label className="field">
                <span className="field-label">Item Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(item.id, e)}
                />
              </label>

              {item.image && (
                <div className="form-image-preview">
                  <img src={item.image} alt="Item Preview" />
                </div>
              )}

              <div className="item-footer">
                <span>
                  Line Total:{' '}
                  <strong>
                    {(item.qty * item.unitPrice).toLocaleString('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => openCosting(item)}
                  >
                    Costing
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline" onClick={addItem}>
            + Add Item
          </button>
        </section>

        {/* Totals */}
        <section className="card">
          <h2 className="card-title">Totals & Tax</h2>
          <TextInput
            label="Discount (EGP)"
            type="number"
            value={String(discount)}
            onChange={(v) => setDiscount(Number(v || 0))}
          />
          <TextInput
            label="VAT %"
            type="number"
            value={String(vatRate)}
            onChange={(v) => setVatRate(Number(v || 0))}
          />
        </section>

        {/* Notes */}
        <section className="card">
          <h2 className="card-title">Notes / Terms</h2>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </label>
        </section>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn-outline" onClick={saveInvoice}>
            Save Locally
          </button>
          <button className="btn-outline" onClick={loadInvoice}>
            Load Local
          </button>
        </div>

        <button className="btn-primary" onClick={handleSaveToDatabase} style={{ marginBottom: 8 }}>
          Save to Database
        </button>

        <button className="btn-primary" onClick={handlePreview}>
          Preview Invoice (New Window)
        </button>
      </div>

      {/* Pricing settings popup */}
      <PricingModal
        isOpen={pricingModalOpen}
        config={pricingConfig}
        onChange={setPricingConfig}
        onClose={() => setPricingModalOpen(false)}
      />

      {/* Door costing popup */}
      <DoorCostModal
        isOpen={doorModalOpen}
        onClose={() => setDoorModalOpen(false)}
        onApply={handleApplyDoorPrice}
        pricing={pricingConfig}
      />

      {/* Seating costing popup */}
      <SeatingCostModal
        isOpen={seatModalOpen}
        onClose={() => setSeatModalOpen(false)}
        onApply={handleApplySeatPrice}
        pricing={pricingConfig}
      />

      {/* Table costing popup */}
      <TableCostModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        onApply={handleApplyTablePrice}
        pricing={pricingConfig}
      />

      {/* Sofa costing popup */}
      <SofaCostModal
        isOpen={sofaModalOpen}
        onClose={() => setSofaModalOpen(false)}
        onApply={handleApplySofaPrice}
        pricing={pricingConfig}
      />

      {/* Cabinet costing popup */}
      <CabinetCostModal
        isOpen={cabinetModalOpen}
        onClose={() => setCabinetModalOpen(false)}
        onApply={handleApplyCabinetPrice}
        pricing={pricingConfig}
      />
    </div>
  );
};

/* ================= PRICING MODAL ================= */

type PricingModalProps = {
  isOpen: boolean;
  config: PricingConfig;
  onChange: (cfg: PricingConfig) => void;
  onClose: () => void;
};

const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  config,
  onChange,
  onClose,
}) => {
  const [draft, setDraft] = useState<PricingConfig>(config);

  const handleField = (field: keyof PricingConfig, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: Number(value || 0),
    }));
  };

  const handleSave = () => {
    onChange(draft);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Pricing Settings
        </h2>

        <h3 className="card-title" style={{ fontSize: 12 }}>
          Natural Wood (EGP / m³)
        </h3>
        <div className="item-row">
          <TextInput
            label="Mouski"
            type="number"
            value={String(draft.mouskiRate)}
            onChange={(v) => handleField('mouskiRate', v)}
          />
          <TextInput
            label="Zan (Beech)"
            type="number"
            value={String(draft.zanRate)}
            onChange={(v) => handleField('zanRate', v)}
          />
        </div>
        <div className="item-row">
          <TextInput
            label="Aro (Oak)"
            type="number"
            value={String(draft.aroRate)}
            onChange={(v) => handleField('aroRate', v)}
          />
          <TextInput
            label="Beech Pine"
            type="number"
            value={String(draft.beechPineRate)}
            onChange={(v) => handleField('beechPineRate', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          MDF Panels (EGP / sheet 122×244)
        </h3>
        <div className="item-row">
          <TextInput
            label="MDF 10 mm"
            type="number"
            value={String(draft.mdf10RatePerSheet)}
            onChange={(v) => handleField('mdf10RatePerSheet', v)}
          />
          <TextInput
            label="MDF 16 mm"
            type="number"
            value={String(draft.mdf16RatePerSheet)}
            onChange={(v) => handleField('mdf16RatePerSheet', v)}
          />
          <TextInput
            label="MDF 21 mm"
            type="number"
            value={String(draft.mdf21RatePerSheet)}
            onChange={(v) => handleField('mdf21RatePerSheet', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Blockboard & Marble
        </h3>
        <div className="item-row">
          <TextInput
            label="Blockboard 18mm (sheet)"
            type="number"
            value={String(draft.blockboard18RatePerSheet)}
            onChange={(v) => handleField('blockboard18RatePerSheet', v)}
          />
          <TextInput
            label="Marble (EGP / m²)"
            type="number"
            value={String(draft.marbleRatePerM2)}
            onChange={(v) => handleField('marbleRatePerM2', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Veneer (EGP / m²)
        </h3>
        <div className="item-row">
          <TextInput
            label="Walnut"
            type="number"
            value={String(draft.walnutVeneerRatePerM2)}
            onChange={(v) => handleField('walnutVeneerRatePerM2', v)}
          />
          <TextInput
            label="Oak"
            type="number"
            value={String(draft.oakVeneerRatePerM2)}
            onChange={(v) => handleField('oakVeneerRatePerM2', v)}
          />
          <TextInput
            label="Beech"
            type="number"
            value={String(draft.beechVeneerRatePerM2)}
            onChange={(v) => handleField('beechVeneerRatePerM2', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          HPL / LPL (EGP / sheet 122×244)
        </h3>
        <div className="item-row">
          <TextInput
            label="HPL"
            type="number"
            value={String(draft.hplRatePerSheet)}
            onChange={(v) => handleField('hplRatePerSheet', v)}
          />
          <TextInput
            label="LPL"
            type="number"
            value={String(draft.lplRatePerSheet)}
            onChange={(v) => handleField('lplRatePerSheet', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Finish (EGP / m² / face)
        </h3>
        <div className="item-row">
          <TextInput
            label="PU matte"
            type="number"
            value={String(draft.finishPuMatteRatePerM2)}
            onChange={(v) => handleField('finishPuMatteRatePerM2', v)}
          />
          <TextInput
            label="PU high gloss"
            type="number"
            value={String(draft.finishPuHighGlossRatePerM2)}
            onChange={(v) => handleField('finishPuHighGlossRatePerM2', v)}
          />
        </div>
        <div className="item-row">
          <TextInput
            label="NC"
            type="number"
            value={String(draft.finishNcRatePerM2)}
            onChange={(v) => handleField('finishNcRatePerM2', v)}
          />
          <TextInput
            label="Oil / stain"
            type="number"
            value={String(draft.finishOilRatePerM2)}
            onChange={(v) => handleField('finishOilRatePerM2', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Glass (EGP / m²)
        </h3>
        <div className="item-row">
          <TextInput
            label="Glass 6mm white"
            type="number"
            value={String(draft.glass6RatePerM2)}
            onChange={(v) => handleField('glass6RatePerM2', v)}
          />
          <TextInput
            label="Glass 10mm white"
            type="number"
            value={String(draft.glass10RatePerM2)}
            onChange={(v) => handleField('glass10RatePerM2', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Ply wood (EGP / sheet 122×244)
        </h3>
        <div className="item-row">
          <TextInput
            label="PLY 2.5mm"
            type="number"
            value={String(draft.ply25RatePerSheet)}
            onChange={(v) => handleField('ply25RatePerSheet', v)}
          />
          <TextInput
            label="PLY 2.7mm"
            type="number"
            value={String(draft.ply27RatePerSheet)}
            onChange={(v) => handleField('ply27RatePerSheet', v)}
          />
        </div>
        <div className="item-row">
          <TextInput
            label="PLY 8mm"
            type="number"
            value={String(draft.ply8RatePerSheet)}
            onChange={(v) => handleField('ply8RatePerSheet', v)}
          />
          <TextInput
            label="PLY 12mm"
            type="number"
            value={String(draft.ply12RatePerSheet)}
            onChange={(v) => handleField('ply12RatePerSheet', v)}
          />
          <TextInput
            label="PLY 18mm"
            type="number"
            value={String(draft.ply18RatePerSheet)}
            onChange={(v) => handleField('ply18RatePerSheet', v)}
          />
          <TextInput
            label="Foamboard 18mm (sheet)"
            type="number"
            value={String(draft.foamboardRatePerSheet)}
            onChange={(v) => handleField('foamboardRatePerSheet', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Upholstery (chairs / benches)
        </h3>
        <div className="item-row">
          <TextInput
            label="Seat only"
            type="number"
            value={String(draft.upholsterySeatOnly)}
            onChange={(v) => handleField('upholsterySeatOnly', v)}
          />
          <TextInput
            label="Full seat"
            type="number"
            value={String(draft.upholsteryFull)}
            onChange={(v) => handleField('upholsteryFull', v)}
          />
          <TextInput
            label="Full arm chair"
            type="number"
            value={String(draft.upholsteryArmFull)}
            onChange={(v) => handleField('upholsteryArmFull', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Upholstery (sofas) – per meter
        </h3>
        <div className="item-row">
          <TextInput
            label="Sofa upholstery low / m"
            type="number"
            value={String(draft.upholsterySofaLowPerM)}
            onChange={(v) => handleField('upholsterySofaLowPerM', v)}
          />
          <TextInput
            label="Sofa upholstery high / m"
            type="number"
            value={String(draft.upholsterySofaHighPerM)}
            onChange={(v) => handleField('upholsterySofaHighPerM', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Fabric (EGP / meter)
        </h3>
        <div className="item-row">
          <TextInput
            label="Fabric low (220)"
            type="number"
            value={String(draft.fabricLowRate)}
            onChange={(v) => handleField('fabricLowRate', v)}
          />
          <TextInput
            label="Fabric high (450)"
            type="number"
            value={String(draft.fabricHighRate)}
            onChange={(v) => handleField('fabricHighRate', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Steel chassis
        </h3>
        <div className="item-row">
          <TextInput
            label="Steel chassis / piece"
            type="number"
            value={String(draft.steelChassisCostPerPiece)}
            onChange={(v) => handleField('steelChassisCostPerPiece', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Hardware
        </h3>
        <div className="item-row">
          <TextInput
            label="Drawer runner / drawer"
            type="number"
            value={String(draft.drawerRunnerRate)}
            onChange={(v) => handleField('drawerRunnerRate', v)}
          />
          <TextInput
            label="Door hinge / piece"
            type="number"
            value={String(draft.doorHingeRate)}
            onChange={(v) => handleField('doorHingeRate', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Labor
        </h3>
        <div className="item-row">
          <TextInput
            label="Labor rate (EGP / hour)"
            type="number"
            value={String(draft.laborRatePerHour)}
            onChange={(v) => handleField('laborRatePerHour', v)}
          />
        </div>

        <h3 className="card-title" style={{ fontSize: 12, marginTop: 10 }}>
          Defaults & Compliance
        </h3>
        <div className="item-row">
          <TextInput
            label="Default accessories (EGP)"
            type="number"
            value={String(draft.defaultAccessories)}
            onChange={(v) => handleField('defaultAccessories', v)}
          />
          <TextInput
            label="Default profit margin %"
            type="number"
            value={String(draft.defaultProfitMargin)}
            onChange={(v) => handleField('defaultProfitMargin', v)}
          />
          <TextInput
            label="Compliance / item (EGP)"
            type="number"
            value={String(draft.compliancePerItem)}
            onChange={(v) => handleField('compliancePerItem', v)}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= COMMON TYPES ================= */

type WoodType = 'Mouski' | 'Zan' | 'Aro' | 'BeechPine';
type VeneerType = 'Walnut' | 'Oak' | 'Beech' | 'HPL' | 'LPL';
type GlassType = 'None' | 'Glass6' | 'Glass10';

/* ================= DOOR COST MODAL ================= */

type DoorCostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CostResult) => void;
  pricing: PricingConfig;
};

const DoorCostModal: React.FC<DoorCostModalProps> = ({
  isOpen,
  onClose,
  onApply,
  pricing,
}) => {
  type DoorCostState = {
    heightCm: number;
    widthCm: number;
    thicknessCm: number;
    veneerType: VeneerType;
    finishType: string;
    woodType: WoodType;
    glassType: GlassType;
    glassAreaM2: number;
    accessoriesCost: number;
    overheadCost: number;
    laborHours: number;
    hasSteelChassis: boolean;
    profitMargin: number;
  };

  const [doorCost, setDoorCost] = useState<DoorCostState>({
    heightCm: 220,
    widthCm: 90,
    thicknessCm: 4,
    veneerType: 'Oak',
    finishType: 'PU matte',
    woodType: 'Mouski',
    glassType: 'None',
    glassAreaM2: 0,
    accessoriesCost: pricing.defaultAccessories,
    overheadCost: 0,
    laborHours: 0,
    hasSteelChassis: false,
    profitMargin: pricing.defaultProfitMargin,
  });

  const handleChange = (
    field: keyof DoorCostState,
    value: string | boolean
  ) => {
    if (typeof value === 'boolean') {
      setDoorCost((prev) => ({ ...prev, [field]: value }));
    } else {
      setDoorCost((prev) => ({
        ...prev,
        [field]:
          typeof prev[field] === 'number' ? Number(value || 0) : (value as any),
      }));
    }
  };

  // مساحات وأحجام الباب
  const leafAreaM2 = (doorCost.heightCm / 100) * (doorCost.widthCm / 100); // وش واحد
  const areaBothFacesM2 = leafAreaM2 * 2;
  const volumeM3 = leafAreaM2 * (doorCost.thicknessCm / 100);

  // فريم طبيعي
  const frameVolumeM3 =
    0.045 * (doorCost.heightCm / 220) * (doorCost.widthCm / 90);

  let woodRatePerM3 = pricing.mouskiRate;
  if (doorCost.woodType === 'Zan') woodRatePerM3 = pricing.zanRate;
  if (doorCost.woodType === 'Aro') woodRatePerM3 = pricing.aroRate;
  if (doorCost.woodType === 'BeechPine') woodRatePerM3 = pricing.beechPineRate;

  const naturalWoodCost = frameVolumeM3 * woodRatePerM3;

  // MDF 10 مم للوشين
  const sheetAreaM2 = 1.22 * 2.44;
  const mdfSheetsNeeded = areaBothFacesM2 / sheetAreaM2;
  const mdf10Cost = mdfSheetsNeeded * pricing.mdf10RatePerSheet;

  // فينير / HPL / LPL
  let veneerCost = 0;
  let finishCost = 0;

  if (doorCost.veneerType === 'Walnut') {
    veneerCost = areaBothFacesM2 * pricing.walnutVeneerRatePerM2;
  } else if (doorCost.veneerType === 'Oak') {
    veneerCost = areaBothFacesM2 * pricing.oakVeneerRatePerM2;
  } else if (doorCost.veneerType === 'Beech') {
    veneerCost = areaBothFacesM2 * pricing.beechVeneerRatePerM2;
  } else if (doorCost.veneerType === 'HPL' || doorCost.veneerType === 'LPL') {
    const veneerSheetsNeeded = areaBothFacesM2 / sheetAreaM2;
    if (doorCost.veneerType === 'HPL') {
      veneerCost = veneerSheetsNeeded * pricing.hplRatePerSheet;
    } else if (doorCost.veneerType === 'LPL') {
      veneerCost = veneerSheetsNeeded * pricing.lplRatePerSheet;
    }
    finishCost = 0; // مفيش تشطيب
  }

  if (
    doorCost.veneerType === 'Walnut' ||
    doorCost.veneerType === 'Oak' ||
    doorCost.veneerType === 'Beech'
  ) {
    let finishRatePerM2 = 0;
    if (doorCost.finishType === 'PU matte') {
      finishRatePerM2 = pricing.finishPuMatteRatePerM2;
    } else if (doorCost.finishType === 'PU high gloss') {
      finishRatePerM2 = pricing.finishPuHighGlossRatePerM2;
    } else if (doorCost.finishType === 'NC') {
      finishRatePerM2 = pricing.finishNcRatePerM2;
    } else if (doorCost.finishType === 'Oil / stain') {
      finishRatePerM2 = pricing.finishOilRatePerM2;
    }
    finishCost = areaBothFacesM2 * finishRatePerM2;
  }

  // زجاج
  let glassCost = 0;
  if (doorCost.glassType === 'Glass6') {
    glassCost = doorCost.glassAreaM2 * pricing.glass6RatePerM2;
  } else if (doorCost.glassType === 'Glass10') {
    glassCost = doorCost.glassAreaM2 * pricing.glass10RatePerM2;
  }

  // شاسية حديد
  const steelCost = doorCost.hasSteelChassis
    ? pricing.steelChassisCostPerPiece
    : 0;

  // عمالة
  const laborCost = doorCost.laborHours * pricing.laborRatePerHour;

  // إجمالي تكلفة الباب
  const materialCost =
    naturalWoodCost +
    mdf10Cost +
    veneerCost +
    finishCost +
    glassCost +
    steelCost +
    doorCost.accessoriesCost +
    doorCost.overheadCost +
    laborCost;

  const profitValue = (materialCost * doorCost.profitMargin) / 100;
  const sellingPrice = materialCost + profitValue;

  const finishDisabled =
    doorCost.veneerType === 'HPL' || doorCost.veneerType === 'LPL';

  const hasGlass =
    doorCost.glassType === 'Glass6' || doorCost.glassType === 'Glass10';

  const buildDescription = () => {
    const parts: string[] = [];

    let woodLabel = 'Mouski';
    if (doorCost.woodType === 'Zan') woodLabel = 'Zan (Beech)';
    else if (doorCost.woodType === 'Aro') woodLabel = 'Aro (Oak)';
    else if (doorCost.woodType === 'BeechPine') woodLabel = 'Beech pine';

    parts.push(`Wood: ${woodLabel}`);

    let veneerLabel = '';
    if (doorCost.veneerType === 'Walnut') veneerLabel = 'Walnut veneer';
    else if (doorCost.veneerType === 'Oak') veneerLabel = 'Oak veneer';
    else if (doorCost.veneerType === 'Beech') veneerLabel = 'Beech veneer';
    else if (doorCost.veneerType === 'HPL') veneerLabel = 'HPL facing';
    else if (doorCost.veneerType === 'LPL') veneerLabel = 'LPL facing';

    parts.push(`Veneer: ${veneerLabel}`);

    if (
      doorCost.veneerType === 'Walnut' ||
      doorCost.veneerType === 'Oak' ||
      doorCost.veneerType === 'Beech'
    ) {
      parts.push(`Finish: ${doorCost.finishType}`);
    } else {
      parts.push('Finish: none (HPL / LPL)');
    }

    if (doorCost.glassType === 'Glass6') {
      parts.push(`Glass: 6mm white, ${doorCost.glassAreaM2.toFixed(2)} m²`);
    } else if (doorCost.glassType === 'Glass10') {
      parts.push(`Glass: 10mm white, ${doorCost.glassAreaM2.toFixed(2)} m²`);
    } else {
      parts.push('Glass: none');
    }

    if (doorCost.hasSteelChassis) {
      parts.push('Steel chassis: yes');
    }

    return parts.join(' – ');
  };

  const handleApplyClick = () => {
    const desc = buildDescription();
    const dims = `${doorCost.heightCm}×${doorCost.widthCm}×${doorCost.thicknessCm} cm`;
    onApply({
      price: sellingPrice,
      description: desc,
      dimensions: dims,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Door Costing
        </h2>

        <div className="item-row">
          <TextInput
            label="Height (cm)"
            type="number"
            value={String(doorCost.heightCm)}
            onChange={(v) => handleChange('heightCm', v)}
          />
          <TextInput
            label="Width (cm)"
            type="number"
            value={String(doorCost.widthCm)}
            onChange={(v) => handleChange('widthCm', v)}
          />
          <TextInput
            label="Thickness (cm)"
            type="number"
            value={String(doorCost.thicknessCm)}
            onChange={(v) => handleChange('thicknessCm', v)}
          />
        </div>

        <label className="field">
          <span className="field-label">Frame wood type</span>
          <select
            className="input"
            value={doorCost.woodType}
            onChange={(e) => handleChange('woodType', e.target.value)}
          >
            <option value="Mouski">Mouski</option>
            <option value="Zan">Zan (Beech)</option>
            <option value="Aro">Aro (Oak)</option>
            <option value="BeechPine">Beech Pine</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Facing / Skin Type</span>
          <select
            className="input"
            value={doorCost.veneerType}
            onChange={(e) => handleChange('veneerType', e.target.value)}
          >
            <option value="Walnut">Walnut veneer</option>
            <option value="Oak">Oak veneer</option>
            <option value="Beech">Beech veneer</option>
            <option value="HPL">HPL</option>
            <option value="LPL">LPL</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Finish Type</span>
          <select
            className="input"
            value={doorCost.finishType}
            onChange={(e) => handleChange('finishType', e.target.value)}
            disabled={finishDisabled}
          >
            <option>PU matte</option>
            <option>PU high gloss</option>
            <option>NC</option>
            <option>Oil / stain</option>
          </select>
          {finishDisabled && (
            <span
              style={{
                fontSize: 10,
                color: '#9ca3af',
                marginTop: 2,
                display: 'block',
              }}
            >
              HPL / LPL لا يأخذ تشطيب إضافي (Finish cost = 0)
            </span>
          )}
        </label>

        <label className="field">
          <span className="field-label">Glass</span>
          <select
            className="input"
            value={doorCost.glassType}
            onChange={(e) => handleChange('glassType', e.target.value)}
          >
            <option value="None">No glass</option>
            <option value="Glass6">Glass 6mm white</option>
            <option value="Glass10">Glass 10mm white</option>
          </select>
        </label>

        {hasGlass && (
          <TextInput
            label="Glass area (m²)"
            type="number"
            value={String(doorCost.glassAreaM2)}
            onChange={(v) => handleChange('glassAreaM2', v)}
          />
        )}

        <TextInput
          label="Accessories (EGP)"
          type="number"
          value={String(doorCost.accessoriesCost)}
          onChange={(v) => handleChange('accessoriesCost', v)}
        />

        <TextInput
          label="Overhead (EGP)"
          type="number"
          value={String(doorCost.overheadCost)}
          onChange={(v) => handleChange('overheadCost', v)}
        />

        <TextInput
          label="Labor hours"
          type="number"
          value={String(doorCost.laborHours)}
          onChange={(v) => handleChange('laborHours', v)}
        />

        <label className="field field-inline">
          <span className="field-label">Steel chassis</span>
          <input
            type="checkbox"
            checked={doorCost.hasSteelChassis}
            onChange={(e) => handleChange('hasSteelChassis', e.target.checked)}
          />
          <span className="field-hint">
            +{' '}
            {pricing.steelChassisCostPerPiece.toLocaleString('en-EG', {
              style: 'currency',
              currency: 'EGP',
              minimumFractionDigits: 0,
            })}{' '}
            per piece
          </span>
        </label>

        <TextInput
          label="Profit Margin %"
          type="number"
          value={String(doorCost.profitMargin)}
          onChange={(v) => handleChange('profitMargin', v)}
        />

        <div style={{ fontSize: 11, marginTop: 8 }}>
          <div>Leaf area (one face): {leafAreaM2.toFixed(2)} m²</div>
          <div>Area both faces: {areaBothFacesM2.toFixed(2)} m²</div>
          <div>Leaf volume: {volumeM3.toFixed(3)} m³</div>
          <div>Frame volume (natural wood): {frameVolumeM3.toFixed(3)} m³</div>
          <div>Natural wood cost: {naturalWoodCost.toFixed(0)} EGP</div>
          <div>MDF 10mm (both faces): {mdf10Cost.toFixed(0)} EGP</div>
          <div>Skin / veneer / HPL / LPL: {veneerCost.toFixed(0)} EGP</div>
          <div>Finish cost: {finishCost.toFixed(0)} EGP</div>
          <div>Glass cost: {glassCost.toFixed(0)} EGP</div>
          <div>Accessories: {doorCost.accessoriesCost.toFixed(0)} EGP</div>
          <div>Overhead: {doorCost.overheadCost.toFixed(0)} EGP</div>
          <div>
            Labor: {doorCost.laborHours.toFixed(2)} h ×{' '}
            {pricing.laborRatePerHour} = {laborCost.toFixed(0)} EGP
          </div>
          <div>Steel chassis: {steelCost.toFixed(0)} EGP</div>
          <div style={{ marginTop: 4 }}>
            <strong>Material cost: {materialCost.toFixed(0)} EGP</strong>
          </div>
          <div>
            Profit ({doorCost.profitMargin}%): {profitValue.toFixed(0)} EGP
          </div>
          <div>
            <strong>
              Suggested selling price / door: {sellingPrice.toFixed(0)} EGP
            </strong>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyClick}
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= SEATING COST MODAL ================= */

type SeatingCostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CostResult) => void;
  pricing: PricingConfig;
};

type SeatItemType = 'Dining chair' | 'Bar stool' | 'Bench' | 'Arm chair';

const SeatingCostModal: React.FC<SeatingCostModalProps> = ({
  isOpen,
  onClose,
  onApply,
  pricing,
}) => {
  type DetailLevel = 'Light' | 'Heavy';

  type SeatingState = {
    itemType: SeatItemType;
    detailLevel: DetailLevel;
    solidVolumeM3: number;
    woodType: WoodType;
    hasPly: boolean;
    plyThickness: '2.5' | '2.7' | '8' | '12' | '18';
    plySheets: number;
    areaM2: number;
    veneerType: 'None' | 'Walnut' | 'Oak' | 'Beech';
    finishType: string;
    upholsteryType: 'None' | 'Seat only' | 'Full' | 'Full arm chair';
    fabricType: 'Low' | 'High';
    fabricMeters: number;
    hasSteelChassis: boolean;
    overheadCost: number;
    laborHours: number;
    profitMargin: number;
  };

  const getSolidVolume = (
    itemType: SeatItemType,
    level: DetailLevel
  ): number => {
    if (itemType === 'Dining chair') {
      return level === 'Light' ? 0.025 : 0.035;
    }
    if (itemType === 'Bar stool') {
      return level === 'Light' ? 0.03 : 0.04;
    }
    if (itemType === 'Bench') {
      return level === 'Light' ? 0.035 : 0.05;
    }
    // Arm chair
    return level === 'Light' ? 0.04 : 0.06;
  };

  const getLaborHours = (
    itemType: SeatItemType,
    level: DetailLevel
  ): number => {
    if (itemType === 'Dining chair') {
      return level === 'Light' ? 3 : 4;
    }
    if (itemType === 'Bar stool') {
      return level === 'Light' ? 3 : 4.5;
    }
    if (itemType === 'Bench') {
      return level === 'Light' ? 3.5 : 5;
    }
    return level === 'Light' ? 4 : 5.5;
  };

  const [state, setState] = useState<SeatingState>(() => {
    const initialType: SeatItemType = 'Dining chair';
    const initialLevel: DetailLevel = 'Light';
    return {
      itemType: initialType,
      detailLevel: initialLevel,
      solidVolumeM3: getSolidVolume(initialType, initialLevel),
      woodType: 'Mouski',
      hasPly: false,
      plyThickness: '2.7',
      plySheets: 2,
      areaM2: 1.2,
      veneerType: 'None',
      finishType: 'PU matte',
      upholsteryType: 'Seat only',
      fabricType: 'Low',
      fabricMeters: 1.5,
      hasSteelChassis: false,
      overheadCost: 350,
      laborHours: getLaborHours(initialType, initialLevel),
      profitMargin: pricing.defaultProfitMargin,
    };
  });

  const handleChange = <K extends keyof SeatingState>(
    field: K,
    value: SeatingState[K]
  ) => {
    setState((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'itemType' || field === 'detailLevel') {
        const itemType =
          field === 'itemType' ? (value as SeatItemType) : next.itemType;
        const level =
          field === 'detailLevel' ? (value as DetailLevel) : next.detailLevel;

        next.solidVolumeM3 = getSolidVolume(itemType, level);
        next.laborHours = getLaborHours(itemType, level);
      }
      return next;
    });
  };

  // Wood cost
  let woodRatePerM3 = pricing.mouskiRate;
  if (state.woodType === 'Zan') woodRatePerM3 = pricing.zanRate;
  if (state.woodType === 'Aro') woodRatePerM3 = pricing.aroRate;
  if (state.woodType === 'BeechPine') woodRatePerM3 = pricing.beechPineRate;

  const naturalWoodCost = state.solidVolumeM3 * woodRatePerM3;

  // Ply cost
  let plyRate = 0;
  if (state.plyThickness === '2.5') plyRate = pricing.ply25RatePerSheet;
  else if (state.plyThickness === '2.7') plyRate = pricing.ply27RatePerSheet;
  else if (state.plyThickness === '8') plyRate = pricing.ply8RatePerSheet;
  else if (state.plyThickness === '12') plyRate = pricing.ply12RatePerSheet;
  else if (state.plyThickness === '18') plyRate = pricing.ply18RatePerSheet;

  const plyCost = state.hasPly ? state.plySheets * plyRate : 0;

  // Veneer cost
  let veneerRate = 0;
  if (state.veneerType === 'Walnut') veneerRate = pricing.walnutVeneerRatePerM2;
  else if (state.veneerType === 'Oak') veneerRate = pricing.oakVeneerRatePerM2;
  else if (state.veneerType === 'Beech')
    veneerRate = pricing.beechVeneerRatePerM2;

  const veneerCost =
    state.veneerType === 'None' ? 0 : state.areaM2 * veneerRate;

  // Finish cost
  let finishRatePerM2 = 0;
  if (state.finishType === 'PU matte') {
    finishRatePerM2 = pricing.finishPuMatteRatePerM2;
  } else if (state.finishType === 'PU high gloss') {
    finishRatePerM2 = pricing.finishPuHighGlossRatePerM2;
  } else if (state.finishType === 'NC') {
    finishRatePerM2 = pricing.finishNcRatePerM2;
  } else if (state.finishType === 'Oil / stain') {
    finishRatePerM2 = pricing.finishOilRatePerM2;
  }

  const finishCost = state.areaM2 * finishRatePerM2;

  // Upholstery labor
  let upholsteryLabor = 0;
  if (state.upholsteryType === 'Seat only') {
    upholsteryLabor = pricing.upholsterySeatOnly;
  } else if (state.upholsteryType === 'Full') {
    upholsteryLabor = pricing.upholsteryFull;
  } else if (state.upholsteryType === 'Full arm chair') {
    upholsteryLabor = pricing.upholsteryArmFull;
  }

  // Fabric
  let fabricRate = 0;
  if (state.fabricType === 'Low') fabricRate = pricing.fabricLowRate;
  else if (state.fabricType === 'High') fabricRate = pricing.fabricHighRate;

  const fabricCost =
    state.upholsteryType === 'None' ? 0 : state.fabricMeters * fabricRate;

  // Steel chassis
  const steelCost = state.hasSteelChassis
    ? pricing.steelChassisCostPerPiece
    : 0;

  const laborCost = state.laborHours * pricing.laborRatePerHour;

  const materialCost =
    naturalWoodCost +
    plyCost +
    veneerCost +
    finishCost +
    upholsteryLabor +
    fabricCost +
    state.overheadCost +
    laborCost +
    steelCost;

  const profitValue = (materialCost * state.profitMargin) / 100;
  const sellingPrice = materialCost + profitValue;

  const buildDescription = () => {
    const parts: string[] = [];

    let woodLabel = 'Mouski';
    if (state.woodType === 'Zan') woodLabel = 'Zan (Beech)';
    else if (state.woodType === 'Aro') woodLabel = 'Aro (Oak)';
    else if (state.woodType === 'BeechPine') woodLabel = 'Beech pine';

    parts.push(`Wood: ${woodLabel}`);

    let veneerLabel = 'none';
    if (state.veneerType === 'Walnut') veneerLabel = 'Walnut veneer';
    else if (state.veneerType === 'Oak') veneerLabel = 'Oak veneer';
    else if (state.veneerType === 'Beech') veneerLabel = 'Beech veneer';

    parts.push(`Veneer: ${veneerLabel}`);

    parts.push(`Finish: ${state.finishType}`);

    if (state.upholsteryType === 'None') {
      parts.push('Fabric: none');
    } else {
      const fabricGrade =
        state.fabricType === 'Low' ? 'Low grade' : 'High grade';
      parts.push(
        `Fabric: ${fabricGrade} (${fabricRate} EGP/m, ${state.fabricMeters.toFixed(
          2
        )} m)`
      );
    }

    return parts.join(' – ');
  };

  const handleApplyClick = () => {
    const desc = buildDescription();
    onApply({
      price: sellingPrice,
      description: desc,
      dimensions: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Seating Costing (Chairs / Bench / Bar stool)
        </h2>

        <label className="field">
          <span className="field-label">Item type</span>
          <select
            className="input"
            value={state.itemType}
            onChange={(e) =>
              handleChange('itemType', e.target.value as SeatItemType)
            }
          >
            <option>Dining chair</option>
            <option>Bar stool</option>
            <option>Bench</option>
            <option>Arm chair</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Solid wood details</span>
          <select
            className="input"
            value={state.detailLevel}
            onChange={(e) =>
              handleChange('detailLevel', e.target.value as DetailLevel)
            }
          >
            <option value="Light">Simple details (less wood)</option>
            <option value="Heavy">Rich details (more wood)</option>
          </select>
          <span className="field-hint">
            Volume: {state.solidVolumeM3.toFixed(3)} m³
          </span>
        </label>

        <label className="field">
          <span className="field-label">Wood type</span>
          <select
            className="input"
            value={state.woodType}
            onChange={(e) =>
              handleChange('woodType', e.target.value as WoodType)
            }
          >
            <option value="Mouski">Mouski</option>
            <option value="Zan">Zan (Beech)</option>
            <option value="Aro">Aro (Oak)</option>
            <option value="BeechPine">Beech Pine</option>
          </select>
        </label>

        <label className="field field-inline">
          <span className="field-label">Curved back / ply layers</span>
          <input
            type="checkbox"
            checked={state.hasPly}
            onChange={(e) => handleChange('hasPly', e.target.checked)}
          />
        </label>

        {state.hasPly && (
          <div className="item-row">
            <label className="field">
              <span className="field-label">Ply thickness</span>
              <select
                className="input"
                value={state.plyThickness}
                onChange={(e) =>
                  handleChange(
                    'plyThickness',
                    e.target.value as SeatingState['plyThickness']
                  )
                }
              >
                <option value="2.5">2.5 mm</option>
                <option value="2.7">2.7 mm</option>
                <option value="8">8 mm</option>
                <option value="12">12 mm</option>
                <option value="18">18 mm</option>
              </select>
            </label>
            <TextInput
              label="Ply sheets (pcs)"
              type="number"
              value={String(state.plySheets)}
              onChange={(v) => handleChange('plySheets', Number(v || 0))}
            />
          </div>
        )}

        <div className="item-row">
          <label className="field">
            <span className="field-label">Veneer</span>
            <select
              className="input"
              value={state.veneerType}
              onChange={(e) =>
                handleChange(
                  'veneerType',
                  e.target.value as SeatingState['veneerType']
                )
              }
            >
              <option value="None">None</option>
              <option value="Walnut">Walnut veneer</option>
              <option value="Oak">Oak veneer</option>
              <option value="Beech">Beech veneer</option>
            </select>
          </label>
          <TextInput
            label="Area for veneer/finish (m²)"
            type="number"
            value={String(state.areaM2)}
            onChange={(v) => handleChange('areaM2', Number(v || 0))}
          />
        </div>

        <label className="field">
          <span className="field-label">Finish Type</span>
          <select
            className="input"
            value={state.finishType}
            onChange={(e) => handleChange('finishType', e.target.value)}
          >
            <option>PU matte</option>
            <option>PU high gloss</option>
            <option>NC</option>
            <option>Oil / stain</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Upholstery</span>
          <select
            className="input"
            value={state.upholsteryType}
            onChange={(e) =>
              handleChange(
                'upholsteryType',
                e.target.value as SeatingState['upholsteryType']
              )
            }
          >
            <option>None</option>
            <option>Seat only</option>
            <option>Full</option>
            <option>Full arm chair</option>
          </select>
        </label>

        {state.upholsteryType !== 'None' && (
          <div className="item-row">
            <label className="field">
              <span className="field-label">Fabric type</span>
              <select
                className="input"
                value={state.fabricType}
                onChange={(e) =>
                  handleChange(
                    'fabricType',
                    e.target.value as SeatingState['fabricType']
                  )
                }
              >
                <option value="Low">Low (220 EGP/m default)</option>
                <option value="High">High (450 EGP/m default)</option>
              </select>
            </label>
            <TextInput
              label="Fabric length (m)"
              type="number"
              value={String(state.fabricMeters)}
              onChange={(v) => handleChange('fabricMeters', Number(v || 0))}
            />
          </div>
        )}

        <label className="field field-inline">
          <span className="field-label">Steel chassis</span>
          <input
            type="checkbox"
            checked={state.hasSteelChassis}
            onChange={(e) => handleChange('hasSteelChassis', e.target.checked)}
          />
          <span className="field-hint">
            +{' '}
            {pricing.steelChassisCostPerPiece.toLocaleString('en-EG', {
              style: 'currency',
              currency: 'EGP',
              minimumFractionDigits: 0,
            })}{' '}
            per piece
          </span>
        </label>

        <TextInput
          label="Overhead (EGP)"
          type="number"
          value={String(state.overheadCost)}
          onChange={(v) => handleChange('overheadCost', Number(v || 0))}
        />

        <TextInput
          label="Labor hours"
          type="number"
          value={String(state.laborHours)}
          onChange={(v) => handleChange('laborHours', Number(v || 0))}
        />

        <TextInput
          label="Profit Margin %"
          type="number"
          value={String(state.profitMargin)}
          onChange={(v) => handleChange('profitMargin', Number(v || 0))}
        />

        <div style={{ fontSize: 11, marginTop: 8 }}>
          <div>Natural wood cost: {naturalWoodCost.toFixed(0)} EGP</div>
          <div>Ply cost: {plyCost.toFixed(0)} EGP</div>
          <div>Veneer cost: {veneerCost.toFixed(0)} EGP</div>
          <div>Finish cost: {finishCost.toFixed(0)} EGP</div>
          <div>Upholstery labor: {upholsteryLabor.toFixed(0)} EGP</div>
          <div>Fabric cost: {fabricCost.toFixed(0)} EGP</div>
          <div>Steel chassis: {steelCost.toFixed(0)} EGP</div>
          <div>Overhead: {state.overheadCost.toFixed(0)} EGP</div>
          <div>
            Labor: {state.laborHours.toFixed(2)} h × {pricing.laborRatePerHour}{' '}
            = {laborCost.toFixed(0)} EGP
          </div>
          <div style={{ marginTop: 4, color: '#fff', fontWeight: 600 }}>
            Material cost: {materialCost.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Profit ({state.profitMargin}%): {profitValue.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Suggested selling price / piece: {sellingPrice.toFixed(0)} EGP
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyClick}
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= TABLE COST MODAL ================= */

type TableCostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CostResult) => void;
  pricing: PricingConfig;
};

type LegMaterial = 'Wood' | 'Steel';
type TopMaterial =
  | 'MDF16'
  | 'MDF21'
  | 'Blockboard18'
  | 'Marble'
  | 'Glass6'
  | 'Glass10';

const TableCostModal: React.FC<TableCostModalProps> = ({
  isOpen,
  onClose,
  onApply,
  pricing,
}) => {
  type TableState = {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    legMaterial: LegMaterial;
    woodType: WoodType;
    topMaterial: TopMaterial;
    veneerType: 'None' | 'Walnut' | 'Oak' | 'Beech';
    finishType: string;
    overheadCost: number;
    laborHours: number;
    profitMargin: number;
  };

  const [state, setState] = useState<TableState>({
    lengthCm: 220,
    widthCm: 110,
    heightCm: 74,
    legMaterial: 'Wood',
    woodType: 'Mouski',
    topMaterial: 'Marble',
    veneerType: 'None',
    finishType: 'PU matte',
    overheadCost: 0,
    laborHours: 0,
    profitMargin: pricing.defaultProfitMargin,
  });

  const handleChange = <K extends keyof TableState>(
    field: K,
    value: TableState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const sheetAreaM2 = 1.22 * 2.44;
  const topAreaM2 = (state.lengthCm / 100) * (state.widthCm / 100);

  // Legs wood volume
  let legsVolumeM3 = 0;
  if (state.legMaterial === 'Wood') {
    legsVolumeM3 =
      0.35 *
      (state.lengthCm / 220) *
      (state.widthCm / 110) *
      (state.heightCm / 74);
  }

  let woodRatePerM3 = pricing.mouskiRate;
  if (state.woodType === 'Zan') woodRatePerM3 = pricing.zanRate;
  if (state.woodType === 'Aro') woodRatePerM3 = pricing.aroRate;
  if (state.woodType === 'BeechPine') woodRatePerM3 = pricing.beechPineRate;

  const legsWoodCost = legsVolumeM3 * woodRatePerM3;

  // Top core / marble / glass
  let topCoreCost = 0;
  let marbleCost = 0;
  let glassCost = 0;

  if (state.topMaterial === 'MDF16') {
    const sheets = topAreaM2 / sheetAreaM2;
    topCoreCost = sheets * pricing.mdf16RatePerSheet;
  } else if (state.topMaterial === 'MDF21') {
    const sheets = topAreaM2 / sheetAreaM2;
    topCoreCost = sheets * pricing.mdf21RatePerSheet;
  } else if (state.topMaterial === 'Blockboard18') {
    const sheets = topAreaM2 / sheetAreaM2;
    topCoreCost = sheets * pricing.blockboard18RatePerSheet;
  } else if (state.topMaterial === 'Marble') {
    marbleCost = topAreaM2 * pricing.marbleRatePerM2;
  } else if (state.topMaterial === 'Glass6') {
    glassCost = topAreaM2 * pricing.glass6RatePerM2;
  } else if (state.topMaterial === 'Glass10') {
    glassCost = topAreaM2 * pricing.glass10RatePerM2;
  }

  // Veneer & finish for wooden tops
  const isWoodTop =
    state.topMaterial === 'MDF16' ||
    state.topMaterial === 'MDF21' ||
    state.topMaterial === 'Blockboard18';

  let veneerRate = 0;
  if (state.veneerType === 'Walnut') veneerRate = pricing.walnutVeneerRatePerM2;
  else if (state.veneerType === 'Oak') veneerRate = pricing.oakVeneerRatePerM2;
  else if (state.veneerType === 'Beech')
    veneerRate = pricing.beechVeneerRatePerM2;

  const veneerCost =
    isWoodTop && state.veneerType !== 'None' ? topAreaM2 * veneerRate : 0;

  let finishRatePerM2 = 0;
  if (state.finishType === 'PU matte') {
    finishRatePerM2 = pricing.finishPuMatteRatePerM2;
  } else if (state.finishType === 'PU high gloss') {
    finishRatePerM2 = pricing.finishPuHighGlossRatePerM2;
  } else if (state.finishType === 'NC') {
    finishRatePerM2 = pricing.finishNcRatePerM2;
  } else if (state.finishType === 'Oil / stain') {
    finishRatePerM2 = pricing.finishOilRatePerM2;
  }

  const finishCost =
    isWoodTop && state.veneerType !== 'None' ? topAreaM2 * finishRatePerM2 : 0;

  const laborCost = state.laborHours * pricing.laborRatePerHour;

  const materialCost =
    legsWoodCost +
    topCoreCost +
    marbleCost +
    glassCost +
    veneerCost +
    finishCost +
    state.overheadCost +
    laborCost;

  const profitValue = (materialCost * state.profitMargin) / 100;
  const sellingPrice = materialCost + profitValue;

  const buildDescription = () => {
    const parts: string[] = [];

    let topLabel = '';
    if (state.topMaterial === 'MDF16') topLabel = 'MDF 16mm';
    else if (state.topMaterial === 'MDF21') topLabel = 'MDF 21mm';
    else if (state.topMaterial === 'Blockboard18') topLabel = 'Blockboard 18mm';
    else if (state.topMaterial === 'Marble') topLabel = 'Marble top';
    else if (state.topMaterial === 'Glass6') topLabel = 'Glass 6mm top';
    else if (state.topMaterial === 'Glass10') topLabel = 'Glass 10mm top';

    let legsLabel = 'Steel';
    if (state.legMaterial === 'Wood') {
      let woodLabel = 'Mouski';
      if (state.woodType === 'Zan') woodLabel = 'Zan (Beech)';
      else if (state.woodType === 'Aro') woodLabel = 'Aro (Oak)';
      else if (state.woodType === 'BeechPine') woodLabel = 'Beech pine';
      legsLabel = woodLabel;
    }

    parts.push(`Top: ${topLabel}`);
    parts.push(`Legs: ${legsLabel}`);

    if (isWoodTop && state.veneerType !== 'None') {
      let veneerLabel = '';
      if (state.veneerType === 'Walnut') veneerLabel = 'Walnut veneer';
      else if (state.veneerType === 'Oak') veneerLabel = 'Oak veneer';
      else if (state.veneerType === 'Beech') veneerLabel = 'Beech veneer';
      parts.push(`Veneer: ${veneerLabel}`);
      parts.push(`Finish: ${state.finishType}`);
    }

    return parts.join(' – ');
  };

  const handleApplyClick = () => {
    const desc = buildDescription();
    const dims = `${state.lengthCm}×${state.widthCm}×${state.heightCm} cm`;
    onApply({
      price: sellingPrice,
      description: desc,
      dimensions: dims,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Table Costing
        </h2>

        <div className="item-row">
          <TextInput
            label="Length (cm)"
            type="number"
            value={String(state.lengthCm)}
            onChange={(v) => handleChange('lengthCm', Number(v || 0))}
          />
          <TextInput
            label="Width (cm)"
            type="number"
            value={String(state.widthCm)}
            onChange={(v) => handleChange('widthCm', Number(v || 0))}
          />
          <TextInput
            label="Height (cm)"
            type="number"
            value={String(state.heightCm)}
            onChange={(v) => handleChange('heightCm', Number(v || 0))}
          />
        </div>

        <label className="field">
          <span className="field-label">Leg material</span>
          <select
            className="input"
            value={state.legMaterial}
            onChange={(e) =>
              handleChange('legMaterial', e.target.value as LegMaterial)
            }
          >
            <option value="Wood">Wood</option>
            <option value="Steel">Steel</option>
          </select>
        </label>

        {state.legMaterial === 'Wood' && (
          <label className="field">
            <span className="field-label">Leg wood type</span>
            <select
              className="input"
              value={state.woodType}
              onChange={(e) =>
                handleChange('woodType', e.target.value as WoodType)
              }
            >
              <option value="Mouski">Mouski</option>
              <option value="Zan">Zan (Beech)</option>
              <option value="Aro">Aro (Oak)</option>
              <option value="BeechPine">Beech Pine</option>
            </select>
          </label>
        )}

        <label className="field">
          <span className="field-label">Top material</span>
          <select
            className="input"
            value={state.topMaterial}
            onChange={(e) =>
              handleChange('topMaterial', e.target.value as TopMaterial)
            }
          >
            <option value="MDF16">MDF 16mm</option>
            <option value="MDF21">MDF 21mm</option>
            <option value="Blockboard18">Blockboard 18mm</option>
            <option value="Marble">Marble</option>
            <option value="Glass6">Glass 6mm</option>
            <option value="Glass10">Glass 10mm</option>
          </select>
        </label>

        {isWoodTop && (
          <>
            <label className="field">
              <span className="field-label">Veneer</span>
              <select
                className="input"
                value={state.veneerType}
                onChange={(e) =>
                  handleChange(
                    'veneerType',
                    e.target.value as TableState['veneerType']
                  )
                }
              >
                <option value="None">None</option>
                <option value="Walnut">Walnut veneer</option>
                <option value="Oak">Oak veneer</option>
                <option value="Beech">Beech veneer</option>
              </select>
            </label>

            {state.veneerType !== 'None' && (
              <label className="field">
                <span className="field-label">Finish Type</span>
                <select
                  className="input"
                  value={state.finishType}
                  onChange={(e) => handleChange('finishType', e.target.value)}
                >
                  <option>PU matte</option>
                  <option>PU high gloss</option>
                  <option>NC</option>
                  <option>Oil / stain</option>
                </select>
                <span className="field-hint">
                  Finish is applied on the veneered wooden top area.
                </span>
              </label>
            )}
          </>
        )}

        {!isWoodTop && (
          <span
            className="field-hint"
            style={{ marginTop: 4, display: 'block' }}
          >
            Marble / glass tops do not take veneer or finish here.
          </span>
        )}

        <TextInput
          label="Overhead (EGP)"
          type="number"
          value={String(state.overheadCost)}
          onChange={(v) => handleChange('overheadCost', Number(v || 0))}
        />

        <TextInput
          label="Labor hours"
          type="number"
          value={String(state.laborHours)}
          onChange={(v) => handleChange('laborHours', Number(v || 0))}
        />

        <TextInput
          label="Profit Margin %"
          type="number"
          value={String(state.profitMargin)}
          onChange={(v) => handleChange('profitMargin', Number(v || 0))}
        />

        <div style={{ fontSize: 11, marginTop: 8 }}>
          <div>Top area: {topAreaM2.toFixed(2)} m²</div>
          <div>Legs wood volume: {legsVolumeM3.toFixed(3)} m³</div>
          <div>Legs wood cost: {legsWoodCost.toFixed(0)} EGP</div>
          <div>Top core cost: {topCoreCost.toFixed(0)} EGP</div>
          <div>Marble cost: {marbleCost.toFixed(0)} EGP</div>
          <div>Glass cost: {glassCost.toFixed(0)} EGP</div>
          <div>Veneer cost: {veneerCost.toFixed(0)} EGP</div>
          <div>Finish cost: {finishCost.toFixed(0)} EGP</div>
          <div>Overhead: {state.overheadCost.toFixed(0)} EGP</div>
          <div>
            Labor: {state.laborHours.toFixed(2)} h × {pricing.laborRatePerHour}{' '}
            = {laborCost.toFixed(0)} EGP
          </div>
          <div style={{ marginTop: 4, color: '#fff', fontWeight: 600 }}>
            Material cost: {materialCost.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Profit ({state.profitMargin}%): {profitValue.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Suggested selling price / table: {sellingPrice.toFixed(0)} EGP
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyClick}
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= SOFA COST MODAL ================= */

type SofaCostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CostResult) => void;
  pricing: PricingConfig;
};

type SofaType = 'Straight' | 'Curved';

const SofaCostModal: React.FC<SofaCostModalProps> = ({
  isOpen,
  onClose,
  onApply,
  pricing,
}) => {
  type SofaState = {
    sofaType: SofaType;
    lengthM: number;
    woodType: WoodType;
    solidVolumePerM3: number;
    veneerType: 'None' | 'Walnut' | 'Oak' | 'Beech';
    veneerAreaM2: number;
    finishType: string;
    upholsteryQuality: 'Low' | 'High' | 'None';
    fabricGrade: 'Low' | 'High';
    fabricMeters: number;
    overheadCost: number;
    laborHours: number;
    profitMargin: number;
  };

  const [state, setState] = useState<SofaState>({
    sofaType: 'Straight',
    lengthM: 2.5,
    woodType: 'Mouski',
    solidVolumePerM3: 0.06,
    veneerType: 'None',
    veneerAreaM2: 4,
    finishType: 'PU matte',
    upholsteryQuality: 'Low',
    fabricGrade: 'Low',
    fabricMeters: 8,
    overheadCost: 0,
    laborHours: 0,
    profitMargin: pricing.defaultProfitMargin,
  });

  const handleChange = <K extends keyof SofaState>(
    field: K,
    value: SofaState[K]
  ) => {
    setState((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'sofaType') {
        next.solidVolumePerM3 = value === 'Straight' ? 0.06 : 0.08;
      }
      return next;
    });
  };

  // Wood cost
  let woodRatePerM3 = pricing.mouskiRate;
  if (state.woodType === 'Zan') woodRatePerM3 = pricing.zanRate;
  if (state.woodType === 'Aro') woodRatePerM3 = pricing.aroRate;
  if (state.woodType === 'BeechPine') woodRatePerM3 = pricing.beechPineRate;

  const woodVolumeM3 = state.lengthM * state.solidVolumePerM3;
  const woodCost = woodVolumeM3 * woodRatePerM3;

  // Veneer
  let veneerRate = 0;
  if (state.veneerType === 'Walnut') veneerRate = pricing.walnutVeneerRatePerM2;
  else if (state.veneerType === 'Oak') veneerRate = pricing.oakVeneerRatePerM2;
  else if (state.veneerType === 'Beech')
    veneerRate = pricing.beechVeneerRatePerM2;

  const veneerCost =
    state.veneerType === 'None' ? 0 : state.veneerAreaM2 * veneerRate;

  // Finish
  let finishRatePerM2 = 0;
  if (state.finishType === 'PU matte') {
    finishRatePerM2 = pricing.finishPuMatteRatePerM2;
  } else if (state.finishType === 'PU high gloss') {
    finishRatePerM2 = pricing.finishPuHighGlossRatePerM2;
  } else if (state.finishType === 'NC') {
    finishRatePerM2 = pricing.finishNcRatePerM2;
  } else if (state.finishType === 'Oil / stain') {
    finishRatePerM2 = pricing.finishOilRatePerM2;
  }

  const finishCost =
    state.veneerType === 'None' ? 0 : state.veneerAreaM2 * finishRatePerM2;

  // Upholstery per meter
  let upholsteryPerM = 0;
  if (state.upholsteryQuality === 'Low') {
    upholsteryPerM = pricing.upholsterySofaLowPerM;
  } else if (state.upholsteryQuality === 'High') {
    upholsteryPerM = pricing.upholsterySofaHighPerM;
  }

  const upholsteryCost =
    state.upholsteryQuality === 'None' ? 0 : state.lengthM * upholsteryPerM;

  // Fabric
  let fabricRate = 0;
  if (state.fabricGrade === 'Low') fabricRate = pricing.fabricLowRate;
  else if (state.fabricGrade === 'High') fabricRate = pricing.fabricHighRate;

  const fabricCost =
    state.upholsteryQuality === 'None' ? 0 : state.fabricMeters * fabricRate;

  const laborCost = state.laborHours * pricing.laborRatePerHour;

  const materialCost =
    woodCost +
    veneerCost +
    finishCost +
    upholsteryCost +
    fabricCost +
    state.overheadCost +
    laborCost;

  const profitValue = (materialCost * state.profitMargin) / 100;
  const sellingPrice = materialCost + profitValue;

  const buildDescription = () => {
    const parts: string[] = [];

    let woodLabel = 'Mouski';
    if (state.woodType === 'Zan') woodLabel = 'Zan (Beech)';
    else if (state.woodType === 'Aro') woodLabel = 'Aro (Oak)';
    else if (state.woodType === 'BeechPine') woodLabel = 'Beech pine';

    parts.push(`Wood: ${woodLabel}`);

    let veneerLabel = 'none';
    if (state.veneerType === 'Walnut') veneerLabel = 'Walnut veneer';
    else if (state.veneerType === 'Oak') veneerLabel = 'Oak veneer';
    else if (state.veneerType === 'Beech') veneerLabel = 'Beech veneer';

    parts.push(`Veneer: ${veneerLabel}`);

    parts.push(
      `Finish: ${state.veneerType === 'None' ? 'none' : state.finishType}`
    );

    if (state.upholsteryQuality === 'None') {
      parts.push('Fabric: none');
    } else {
      const fabricGrade =
        state.fabricGrade === 'Low' ? 'Low grade' : 'High grade';
      parts.push(
        `Fabric: ${fabricGrade} (${fabricRate} EGP/m, ${state.fabricMeters.toFixed(
          2
        )} m)`
      );
    }

    return parts.join(' – ');
  };

  const handleApplyClick = () => {
    const desc = buildDescription();
    onApply({
      price: sellingPrice,
      description: desc,
      dimensions: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Sofa Costing (per meter)
        </h2>

        <label className="field">
          <span className="field-label">Sofa type</span>
          <select
            className="input"
            value={state.sofaType}
            onChange={(e) =>
              handleChange('sofaType', e.target.value as SofaType)
            }
          >
            <option value="Straight">Straight</option>
            <option value="Curved">Curved</option>
          </select>
          <span className="field-hint">
            Curved sofas take more wood and labor.
          </span>
        </label>

        <TextInput
          label="Length (m)"
          type="number"
          value={String(state.lengthM)}
          onChange={(v) => handleChange('lengthM', Number(v || 0))}
        />

        <label className="field">
          <span className="field-label">Wood type</span>
          <select
            className="input"
            value={state.woodType}
            onChange={(e) =>
              handleChange('woodType', e.target.value as WoodType)
            }
          >
            <option value="Mouski">Mouski</option>
            <option value="Zan">Zan (Beech)</option>
            <option value="Aro">Aro (Oak)</option>
            <option value="BeechPine">Beech Pine</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Veneer</span>
          <select
            className="input"
            value={state.veneerType}
            onChange={(e) =>
              handleChange(
                'veneerType',
                e.target.value as SofaState['veneerType']
              )
            }
          >
            <option value="None">None</option>
            <option value="Walnut">Walnut veneer</option>
            <option value="Oak">Oak veneer</option>
            <option value="Beech">Beech veneer</option>
          </select>
        </label>

        {state.veneerType !== 'None' && (
          <>
            <TextInput
              label="Veneer / finish area (m²)"
              type="number"
              value={String(state.veneerAreaM2)}
              onChange={(v) => handleChange('veneerAreaM2', Number(v || 0))}
            />
            <label className="field">
              <span className="field-label">Finish Type</span>
              <select
                className="input"
                value={state.finishType}
                onChange={(e) => handleChange('finishType', e.target.value)}
              >
                <option>PU matte</option>
                <option>PU high gloss</option>
                <option>NC</option>
                <option>Oil / stain</option>
              </select>
            </label>
          </>
        )}

        <label className="field">
          <span className="field-label">Upholstery quality</span>
          <select
            className="input"
            value={state.upholsteryQuality}
            onChange={(e) =>
              handleChange(
                'upholsteryQuality',
                e.target.value as SofaState['upholsteryQuality']
              )
            }
          >
            <option value="None">None</option>
            <option value="Low">Low (1250 EGP/m default)</option>
            <option value="High">High (1750 EGP/m default)</option>
          </select>
        </label>

        {state.upholsteryQuality !== 'None' && (
          <>
            <label className="field">
              <span className="field-label">Fabric grade</span>
              <select
                className="input"
                value={state.fabricGrade}
                onChange={(e) =>
                  handleChange(
                    'fabricGrade',
                    e.target.value as SofaState['fabricGrade']
                  )
                }
              >
                <option value="Low">Low (220 EGP/m default)</option>
                <option value="High">High (450 EGP/m default)</option>
              </select>
            </label>
            <TextInput
              label="Fabric length (m)"
              type="number"
              value={String(state.fabricMeters)}
              onChange={(v) => handleChange('fabricMeters', Number(v || 0))}
            />
          </>
        )}

        <TextInput
          label="Overhead (EGP)"
          type="number"
          value={String(state.overheadCost)}
          onChange={(v) => handleChange('overheadCost', Number(v || 0))}
        />

        <TextInput
          label="Labor hours"
          type="number"
          value={String(state.laborHours)}
          onChange={(v) => handleChange('laborHours', Number(v || 0))}
        />

        <TextInput
          label="Profit Margin %"
          type="number"
          value={String(state.profitMargin)}
          onChange={(v) => handleChange('profitMargin', Number(v || 0))}
        />

        <div style={{ fontSize: 11, marginTop: 8 }}>
          <div>Wood volume: {woodVolumeM3.toFixed(3)} m³</div>
          <div>Wood cost: {woodCost.toFixed(0)} EGP</div>
          <div>Veneer cost: {veneerCost.toFixed(0)} EGP</div>
          <div>Finish cost: {finishCost.toFixed(0)} EGP</div>
          <div>Upholstery cost: {upholsteryCost.toFixed(0)} EGP</div>
          <div>Fabric cost: {fabricCost.toFixed(0)} EGP</div>
          <div>Overhead: {state.overheadCost.toFixed(0)} EGP</div>
          <div>
            Labor: {state.laborHours.toFixed(2)} h × {pricing.laborRatePerHour}{' '}
            = {laborCost.toFixed(0)} EGP
          </div>
          <div style={{ marginTop: 4, color: '#fff', fontWeight: 600 }}>
            Material cost: {materialCost.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Profit ({state.profitMargin}%): {profitValue.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Suggested selling price / sofa: {sellingPrice.toFixed(0)} EGP
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyClick}
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= CABINET COST MODAL ================= */

type CabinetCostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: CostResult) => void;
  pricing: PricingConfig;
};

const CabinetCostModal: React.FC<CabinetCostModalProps> = ({
  isOpen,
  onClose,
  onApply,
  pricing,
}) => {
  type CabinetState = {
    widthCm: number;
    heightCm: number;
    depthCm: number;
    bodyMaterial: 'MDF16' | 'MDF21' | 'Blockboard18' | 'Ply18' | 'Foamboard';
    faceMaterial: 'MDF16' | 'MDF21' | 'Blockboard18' | 'Ply18' | 'Foamboard'; // ✅ الوش
    doorsCount: number;
    shelvesCount: number;
    drawersCount: number;
    veneerType: 'None' | 'Walnut' | 'Oak' | 'Beech' | 'HPL' | 'LPL';
    finishType: string;
    accessoriesCost: number;
    overheadCost: number;
    laborHours: number;
    profitMargin: number;
  };

  const [state, setState] = useState<CabinetState>({
    widthCm: 80,
    heightCm: 220,
    depthCm: 40,
    bodyMaterial: 'MDF16',
    faceMaterial: 'MDF16', // ✅ افتراضي نفس الجسم
    doorsCount: 2,
    shelvesCount: 4,
    drawersCount: 0,
    veneerType: 'None',
    finishType: 'PU matte',
    accessoriesCost: pricing.defaultAccessories,
    overheadCost: 0,
    laborHours: 0,
    profitMargin: pricing.defaultProfitMargin,
  });

  const handleChange = <K extends keyof CabinetState>(
    field: K,
    value: CabinetState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const sheetAreaM2 = 1.22 * 2.44;

  const widthM = state.widthCm / 100;
  const heightM = state.heightCm / 100;
  const depthM = state.depthCm / 100;

  // جسم الكابينة (بدون الضهر)
  const sidesArea = 2 * heightM * depthM;
  const topBottomArea = 2 * widthM * depthM;
  const dividerArea = widthM * heightM * 0.3; // تقدير فاصل داخلي
  const bodyAreaM2 = sidesArea + topBottomArea + dividerArea;

  // الضهر
  const backAreaM2 = widthM * heightM;

  // الأرفف
  const shelfAreaOne = widthM * depthM;
  const shelvesAreaM2 = state.shelvesCount * shelfAreaOne;

  // إجمالي الكور MDF / بلوك
  const coreAreaM2 = bodyAreaM2 + shelvesAreaM2;

  // تكلفة الكور
  let bodyCoreRate = pricing.mdf16RatePerSheet;
  if (state.bodyMaterial === 'MDF21') {
    bodyCoreRate = pricing.mdf21RatePerSheet;
  } else if (state.bodyMaterial === 'Blockboard18') {
    bodyCoreRate = pricing.blockboard18RatePerSheet;
  } else if (state.bodyMaterial === 'Ply18') {
    bodyCoreRate = pricing.ply18RatePerSheet;
  } else if (state.bodyMaterial === 'Foamboard') {
    bodyCoreRate = pricing.foamboardRatePerSheet;
  }

  const coreSheets = coreAreaM2 / sheetAreaM2;
  const bodyCoreCost = coreSheets * bodyCoreRate;

  // الضهر MDF 10mm
  const backSheets = backAreaM2 / sheetAreaM2;
  const backCost = backSheets * pricing.mdf10RatePerSheet; // ثابت 10 مم MDF

  // الوش = نفس مساحة الضهر
  const faceAreaM2 = backAreaM2;
  let faceRatePerSheet = pricing.mdf16RatePerSheet;

  if (state.faceMaterial === 'MDF21') {
    faceRatePerSheet = pricing.mdf21RatePerSheet;
  } else if (state.faceMaterial === 'Blockboard18') {
    faceRatePerSheet = pricing.blockboard18RatePerSheet;
  } else if (state.faceMaterial === 'Ply18') {
    faceRatePerSheet = pricing.ply18RatePerSheet;
  } else if (state.faceMaterial === 'Foamboard') {
    faceRatePerSheet = pricing.foamboardRatePerSheet;
  }

  const faceSheets = faceAreaM2 / sheetAreaM2;
  const faceCost = faceSheets * faceRatePerSheet;

  // الضلف + جزء من الجسم قشرة
  const doorsAreaM2 = widthM * heightM;

  const veneerAreaM2 = doorsAreaM2 + bodyAreaM2 * 0.4;

  // قشرة / HPL / LPL
  let veneerCost = 0;
  let finishCost = 0;

  // معدلات القشرة
  let veneerRateM2 = 0;
  if (state.veneerType === 'Walnut')
    veneerRateM2 = pricing.walnutVeneerRatePerM2;
  else if (state.veneerType === 'Oak')
    veneerRateM2 = pricing.oakVeneerRatePerM2;
  else if (state.veneerType === 'Beech')
    veneerRateM2 = pricing.beechVeneerRatePerM2;

  if (
    state.veneerType === 'Walnut' ||
    state.veneerType === 'Oak' ||
    state.veneerType === 'Beech'
  ) {
    veneerCost = veneerAreaM2 * veneerRateM2;

    let finishRatePerM2 = 0;
    if (state.finishType === 'PU matte') {
      finishRatePerM2 = pricing.finishPuMatteRatePerM2;
    } else if (state.finishType === 'PU high gloss') {
      finishRatePerM2 = pricing.finishPuHighGlossRatePerM2;
    } else if (state.finishType === 'NC') {
      finishRatePerM2 = pricing.finishNcRatePerM2;
    } else if (state.finishType === 'Oil / stain') {
      finishRatePerM2 = pricing.finishOilRatePerM2;
    }
    finishCost = veneerAreaM2 * finishRatePerM2;
  } else if (state.veneerType === 'HPL' || state.veneerType === 'LPL') {
    const veneerSheets = veneerAreaM2 / sheetAreaM2;
    if (state.veneerType === 'HPL') {
      veneerCost = veneerSheets * pricing.hplRatePerSheet;
    } else {
      veneerCost = veneerSheets * pricing.lplRatePerSheet;
    }
    finishCost = 0; // HPL / LPL لا تحتاج تشطيب
  }

  // الأدراج (برواز 30×40×18 ply 12mm + قاعدة MDF 10mm 40×30)
  const oneDrawerPlyAreaM2 = 2 * (0.4 * 0.18) + 2 * (0.3 * 0.18);
  const oneDrawerMdfAreaM2 = 0.4 * 0.3;

  const drawersPlySheets =
    (state.drawersCount * oneDrawerPlyAreaM2) / sheetAreaM2;
  const drawersMdfSheets =
    (state.drawersCount * oneDrawerMdfAreaM2) / sheetAreaM2;

  const drawersPlyCost = drawersPlySheets * pricing.ply12RatePerSheet;
  const drawersMdfCost = drawersMdfSheets * pricing.mdf10RatePerSheet;
  const drawersRunnersCost = state.drawersCount * pricing.drawerRunnerRate;

  // عدد المفصلات حسب الارتفاع
  let hingesPerDoor = 2;
  if (state.heightCm > 60 && state.heightCm <= 120) hingesPerDoor = 3;
  else if (state.heightCm > 120 && state.heightCm <= 200) hingesPerDoor = 4;
  else if (state.heightCm > 200 && state.heightCm <= 300) hingesPerDoor = 5;

  const totalHinges = state.doorsCount * hingesPerDoor;
  const hingesCost = totalHinges * pricing.doorHingeRate;

  // شغل و أوفرهيد
  const laborCost = state.laborHours * pricing.laborRatePerHour;

  const materialCost =
    bodyCoreCost +
    backCost +
    faceCost + // ✅ تكلفة الوش
    drawersPlyCost +
    drawersMdfCost +
    drawersRunnersCost +
    veneerCost +
    finishCost +
    hingesCost +
    state.accessoriesCost +
    state.overheadCost +
    laborCost;

  const profitValue = (materialCost * state.profitMargin) / 100;
  const sellingPrice = materialCost + profitValue;

  // --------- MATERIALS BREAKDOWN للـ Excel ---------
  const materials: MaterialRow[] = [];

  if (coreSheets > 0) {
    let bodyLabel = 'MDF 16mm';
    if (state.bodyMaterial === 'MDF21') bodyLabel = 'MDF 21mm';
    else if (state.bodyMaterial === 'Blockboard18')
      bodyLabel = 'Blockboard 18mm';
    else if (state.bodyMaterial === 'Ply18') bodyLabel = 'Plywood 18mm';
    else if (state.bodyMaterial === 'Foamboard') bodyLabel = 'Foamboard 18mm';

    materials.push({
      name: `Cabinet body core (${bodyLabel})`,
      unit: 'sheet',
      qty: parseFloat(coreSheets.toFixed(3)),
    });
  }

  if (backSheets > 0) {
    materials.push({
      name: 'Back (MDF 10mm)',
      unit: 'sheet',
      qty: parseFloat(backSheets.toFixed(3)),
    });
  }
  if (faceSheets > 0) {
    let faceLabel = 'MDF 16mm';
    if (state.faceMaterial === 'MDF21') faceLabel = 'MDF 21mm';
    else if (state.faceMaterial === 'Blockboard18')
      faceLabel = 'Blockboard 18mm';
    else if (state.faceMaterial === 'Ply18') faceLabel = 'Plywood 18mm';
    else if (state.faceMaterial === 'Foamboard') faceLabel = 'Foamboard 18mm';

    materials.push({
      name: `Face panel (${faceLabel})`,
      unit: 'sheet',
      qty: parseFloat(faceSheets.toFixed(3)),
    });
  }

  if (state.drawersCount > 0) {
    materials.push({
      name: 'Drawer boxes PLY 12mm',
      unit: 'sheet',
      qty: parseFloat(drawersPlySheets.toFixed(3)),
    });
    materials.push({
      name: 'Drawer bottoms MDF 10mm',
      unit: 'sheet',
      qty: parseFloat(drawersMdfSheets.toFixed(3)),
    });
    materials.push({
      name: 'Drawer runners',
      unit: 'pair',
      qty: state.drawersCount,
    });
  }

  if (state.veneerType !== 'None') {
    if (
      state.veneerType === 'Walnut' ||
      state.veneerType === 'Oak' ||
      state.veneerType === 'Beech'
    ) {
      materials.push({
        name: `Veneer (${state.veneerType})`,
        unit: 'm²',
        qty: parseFloat(veneerAreaM2.toFixed(2)),
      });
      materials.push({
        name: `Finish (${state.finishType})`,
        unit: 'm²',
        qty: parseFloat(veneerAreaM2.toFixed(2)),
      });
    } else {
      // HPL / LPL
      const veneerSheets = veneerAreaM2 / sheetAreaM2;
      materials.push({
        name: `Laminate (${state.veneerType})`,
        unit: 'sheet',
        qty: parseFloat(veneerSheets.toFixed(3)),
      });
    }
  }

  if (totalHinges > 0) {
    materials.push({
      name: 'Door hinges',
      unit: 'pcs',
      qty: totalHinges,
    });
  }

  // نضيف أوفرهيد و عمالة و أكسسوري كـ rows برقم بالجنيه
  if (state.accessoriesCost > 0) {
    materials.push({
      name: 'Accessories (handles, screws, etc.)',
      unit: 'EGP',
      qty: parseFloat(state.accessoriesCost.toFixed(0)),
    });
  }

  if (state.overheadCost > 0) {
    materials.push({
      name: 'Overhead',
      unit: 'EGP',
      qty: parseFloat(state.overheadCost.toFixed(0)),
    });
  }

  if (laborCost > 0) {
    materials.push({
      name: 'Labor',
      unit: 'EGP',
      qty: parseFloat(laborCost.toFixed(0)),
    });
  }

  materials.push({
    name: 'Profit',
    unit: 'EGP',
    qty: parseFloat(profitValue.toFixed(0)),
  });

  // وصف سطر الفاتورة
  const buildDescription = () => {
    const parts: string[] = [];
    let bodyLabel = 'MDF 16mm';
    if (state.bodyMaterial === 'MDF21') bodyLabel = 'MDF 21mm';
    else if (state.bodyMaterial === 'Blockboard18')
      bodyLabel = 'Blockboard 18mm';
    else if (state.bodyMaterial === 'Ply18') bodyLabel = 'Plywood 18mm';
    else if (state.bodyMaterial === 'Foamboard') bodyLabel = 'Foamboard 18mm';

    parts.push(`Body: ${bodyLabel}`);
    parts.push('Back: MDF 10mm');

    let faceLabel = 'MDF 16mm';
    if (state.faceMaterial === 'MDF21') faceLabel = 'MDF 21mm';
    else if (state.faceMaterial === 'Blockboard18')
      faceLabel = 'Blockboard 18mm';
    else if (state.faceMaterial === 'Ply18') faceLabel = 'Plywood 18mm';
    else if (state.faceMaterial === 'Foamboard') faceLabel = 'Foamboard 18mm';

    parts.push(`Face: ${faceLabel}`);

    parts.push(`Doors: ${state.doorsCount} pcs`);

    parts.push(`Shelves: ${state.shelvesCount} pcs`);
    parts.push(`Drawers: ${state.drawersCount} pcs`);

    let veneerLabel = 'none';
    if (state.veneerType === 'Walnut') veneerLabel = 'Walnut veneer';
    else if (state.veneerType === 'Oak') veneerLabel = 'Oak veneer';
    else if (state.veneerType === 'Beech') veneerLabel = 'Beech veneer';
    else if (state.veneerType === 'HPL') veneerLabel = 'HPL laminate';
    else if (state.veneerType === 'LPL') veneerLabel = 'LPL laminate';

    parts.push(`Facing: ${veneerLabel}`);

    if (
      state.veneerType === 'Walnut' ||
      state.veneerType === 'Oak' ||
      state.veneerType === 'Beech'
    ) {
      parts.push(`Finish: ${state.finishType}`);
    } else if (state.veneerType === 'None') {
      parts.push('Finish: none');
    } else {
      parts.push('Finish: integrated (HPL/LPL)');
    }

    parts.push(`Hinges: ${totalHinges} pcs`);

    return parts.join(' – ');
  };

  const handleApplyClick = () => {
    const desc = buildDescription();
    const dims = `${state.heightCm}×${state.widthCm}×${state.depthCm} cm`;
    onApply({
      price: sellingPrice,
      description: desc,
      dimensions: dims,
      materials,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2 className="card-title" style={{ marginBottom: 12 }}>
          Cabinet Costing
        </h2>

        <div className="item-row">
          <TextInput
            label="Width (cm)"
            type="number"
            value={String(state.widthCm)}
            onChange={(v) => handleChange('widthCm', Number(v || 0))}
          />
          <TextInput
            label="Height (cm)"
            type="number"
            value={String(state.heightCm)}
            onChange={(v) => handleChange('heightCm', Number(v || 0))}
          />
          <TextInput
            label="Depth (cm)"
            type="number"
            value={String(state.depthCm)}
            onChange={(v) => handleChange('depthCm', Number(v || 0))}
          />
        </div>
        <label className="field">
          <span className="field-label">Body panel material</span>
          <select
            className="input"
            value={state.bodyMaterial}
            onChange={(e) =>
              handleChange(
                'bodyMaterial',
                e.target.value as CabinetState['bodyMaterial']
              )
            }
          >
            <option value="MDF16">MDF 16mm</option>
            <option value="MDF21">MDF 21mm</option>
            <option value="Blockboard18">Blockboard 18mm</option>
            <option value="Ply18">Plywood 18mm</option>
            <option value="Foamboard">Foamboard 18mm</option>
          </select>
          <span className="field-hint">
            Body panels (sides, top, bottom, dividers, shelves core).
          </span>
        </label>

        <label className="field">
          <span className="field-label">Face panel material</span>
          <select
            className="input"
            value={state.faceMaterial}
            onChange={(e) =>
              handleChange(
                'faceMaterial',
                e.target.value as CabinetState['faceMaterial']
              )
            }
          >
            <option value="MDF16">MDF 16mm</option>
            <option value="MDF21">MDF 21mm</option>
            <option value="Blockboard18">Blockboard 18mm</option>
            <option value="Ply18">Plywood 18mm</option>
            <option value="Foamboard">Foamboard 18mm</option>
          </select>
          <span className="field-hint">
            Face panel area is same as back (width × height).
          </span>
        </label>

        <div className="item-row">
          <TextInput
            label="Doors (pcs)"
            type="number"
            value={String(state.doorsCount)}
            onChange={(v) => handleChange('doorsCount', Number(v || 0))}
          />
          <TextInput
            label="Shelves (pcs)"
            type="number"
            value={String(state.shelvesCount)}
            onChange={(v) => handleChange('shelvesCount', Number(v || 0))}
          />
          <TextInput
            label="Drawers (pcs)"
            type="number"
            value={String(state.drawersCount)}
            onChange={(v) => handleChange('drawersCount', Number(v || 0))}
          />
        </div>

        <label className="field">
          <span className="field-label">Facing / Veneer</span>
          <select
            className="input"
            value={state.veneerType}
            onChange={(e) =>
              handleChange(
                'veneerType',
                e.target.value as CabinetState['veneerType']
              )
            }
          >
            <option value="None">None</option>
            <option value="Walnut">Walnut veneer</option>
            <option value="Oak">Oak veneer</option>
            <option value="Beech">Beech veneer</option>
            <option value="HPL">HPL</option>
            <option value="LPL">LPL</option>
          </select>
        </label>

        {state.veneerType === 'Walnut' ||
        state.veneerType === 'Oak' ||
        state.veneerType === 'Beech' ? (
          <label className="field">
            <span className="field-label">Finish Type</span>
            <select
              className="input"
              value={state.finishType}
              onChange={(e) => handleChange('finishType', e.target.value)}
            >
              <option>PU matte</option>
              <option>PU high gloss</option>
              <option>NC</option>
              <option>Oil / stain</option>
            </select>
          </label>
        ) : null}

        <TextInput
          label="Accessories (EGP)"
          type="number"
          value={String(state.accessoriesCost)}
          onChange={(v) => handleChange('accessoriesCost', Number(v || 0))}
        />

        <TextInput
          label="Overhead (EGP)"
          type="number"
          value={String(state.overheadCost)}
          onChange={(v) => handleChange('overheadCost', Number(v || 0))}
        />

        <TextInput
          label="Labor hours"
          type="number"
          value={String(state.laborHours)}
          onChange={(v) => handleChange('laborHours', Number(v || 0))}
        />

        <TextInput
          label="Profit Margin %"
          type="number"
          value={String(state.profitMargin)}
          onChange={(v) => handleChange('profitMargin', Number(v || 0))}
        />

        <div style={{ fontSize: 11, marginTop: 8 }}>
          <div>Body area (approx): {bodyAreaM2.toFixed(2)} m²</div>
          <div>Shelves area: {shelvesAreaM2.toFixed(2)} m²</div>
          <div>Core area total: {coreAreaM2.toFixed(2)} m²</div>
          <div>Back area: {backAreaM2.toFixed(2)} m²</div>
          <div>Face area: {faceAreaM2.toFixed(2)} m²</div>
          <div>Core sheets: {coreSheets.toFixed(3)}</div>
          <div>Back sheets: {backSheets.toFixed(3)}</div>
          <div>Face sheets: {faceSheets.toFixed(3)}</div>
          <div>Body core cost: {bodyCoreCost.toFixed(0)} EGP</div>
          <div>Back cost: {backCost.toFixed(0)} EGP</div>
          <div>Face cost: {faceCost.toFixed(0)} EGP</div>
          <div>Veneer / laminate cost: {veneerCost.toFixed(0)} EGP</div>
          <div>Finish cost: {finishCost.toFixed(0)} EGP</div>
          <div>Drawers PLY cost: {drawersPlyCost.toFixed(0)} EGP</div>
          <div>Drawers MDF cost: {drawersMdfCost.toFixed(0)} EGP</div>
          <div>Drawer runners: {drawersRunnersCost.toFixed(0)} EGP</div>
          <div>Hinges cost: {hingesCost.toFixed(0)} EGP</div>
          <div>Accessories: {state.accessoriesCost.toFixed(0)} EGP</div>
          <div>Overhead: {state.overheadCost.toFixed(0)} EGP</div>
          <div>
            Labor: {state.laborHours.toFixed(2)} h × {pricing.laborRatePerHour}{' '}
            = {laborCost.toFixed(0)} EGP
          </div>
          <div style={{ marginTop: 4, color: '#fff', fontWeight: 600 }}>
            Material cost: {materialCost.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Profit ({state.profitMargin}%): {profitValue.toFixed(0)} EGP
          </div>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Suggested selling price / cabinet: {sellingPrice.toFixed(0)} EGP
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyClick}
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= INPUT COMPONENT ================= */

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
}) => {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
};

export default App;
