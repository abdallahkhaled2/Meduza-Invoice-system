import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ToastContainer, useToast } from '../components/Toast';

interface Customer {
  id: string;
  name: string;
  company: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  invoice_count?: number;
  total_revenue?: number;
}

const Customers: React.FC = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    company: '',
    address: '',
    phone: '',
    email: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data: customersData } = await supabase
        .from('clients')
        .select('id, name, company, address, phone, email, created_at')
        .order('name');

      if (customersData) {
        const customersWithStats = await Promise.all(
          customersData.map(async (customer) => {
            const { data: invoices } = await supabase
              .from('invoices')
              .select('total')
              .eq('client_id', customer.id);

            return {
              ...customer,
              invoice_count: invoices?.length || 0,
              total_revenue: invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0,
            };
          })
        );
        setCustomers(customersWithStats);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error('Error', 'Customer name is required');
      return;
    }

    try {
      const { error } = await supabase.from('clients').insert({
        name: newCustomer.name,
        company: newCustomer.company || null,
        address: newCustomer.address || null,
        phone: newCustomer.phone || null,
        email: newCustomer.email || null,
      });

      if (error) throw error;

      toast.success('Success', 'Customer added successfully');
      setShowAddModal(false);
      setNewCustomer({ name: '', company: '', address: '', phone: '', email: '' });
      loadCustomers();
    } catch (error) {
      toast.error('Error', 'Failed to add customer');
    }
  };

  const openDeleteModal = (customerId: string, customerName: string) => {
    setCustomerToDelete({ id: customerId, name: customerName });
    setShowDeleteModal(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success('Success', 'Customer deleted successfully');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (error) {
      toast.error('Error', 'Failed to delete customer. Customer may have associated invoices.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewInvoices = async (customer: Customer) => {
    setSelectedCustomer(customer);

    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_no, project_name, invoice_date, total, status')
      .eq('client_id', customer.id)
      .order('invoice_date', { ascending: false });

    setCustomerInvoices(data || []);
    setShowInvoicesModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e5e7eb',
        }}
      >
        Loading customers...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        padding: '40px 20px',
      }}
    >
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <h1 style={{ margin: 0, color: '#e5e7eb', fontSize: 32, fontWeight: 700 }}>Customers</h1>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '12px 16px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 14,
            }}
          />
        </div>

        <div
          style={{
            background: '#0f172a',
            borderRadius: 12,
            border: '1px solid #1f2937',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={{ textAlign: 'left', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Customer Name
                </th>
                <th style={{ textAlign: 'left', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Company
                </th>
                <th style={{ textAlign: 'left', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Contact
                </th>
                <th style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Orders
                </th>
                <th style={{ textAlign: 'right', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Total Revenue
                </th>
                <th style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: 16, color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>
                      {customer.name}
                    </td>
                    <td style={{ padding: 16, color: '#9ca3af', fontSize: 14 }}>{customer.company || '-'}</td>
                    <td style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>
                      {customer.email && <div>{customer.email}</div>}
                      {customer.phone && <div>{customer.phone}</div>}
                      {!customer.email && !customer.phone && '-'}
                    </td>
                    <td style={{ padding: 16, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {customer.invoice_count}
                      </span>
                    </td>
                    <td style={{ padding: 16, color: '#34d399', fontSize: 14, textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(customer.total_revenue || 0)}
                    </td>
                    <td style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewInvoices(customer)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #38bdf8',
                            background: 'transparent',
                            color: '#38bdf8',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          View Invoices
                        </button>
                        <button
                          onClick={() => openDeleteModal(customer.id, customer.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#1f2937',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', color: '#e5e7eb', fontSize: 20 }}>Add New Customer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Company</label>
                <input
                  type="text"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Phone</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9+\s-]/g, '');
                    setNewCustomer({ ...newCustomer, phone: val });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  color: '#e5e7eb',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoicesModal && selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowInvoicesModal(false)}
        >
          <div
            style={{
              background: '#1f2937',
              borderRadius: 12,
              padding: 24,
              maxWidth: 700,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', color: '#e5e7eb', fontSize: 20 }}>
              Invoices for {selectedCustomer.name}
            </h3>
            {customerInvoices.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>No invoices found</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #374151' }}>
                    <th style={{ textAlign: 'left', padding: 12, color: '#9ca3af', fontSize: 12 }}>Invoice No</th>
                    <th style={{ textAlign: 'left', padding: 12, color: '#9ca3af', fontSize: 12 }}>Project</th>
                    <th style={{ textAlign: 'left', padding: 12, color: '#9ca3af', fontSize: 12 }}>Date</th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#9ca3af', fontSize: 12 }}>Total</th>
                    <th style={{ textAlign: 'center', padding: 12, color: '#9ca3af', fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: 12, color: '#e5e7eb', fontSize: 13 }}>{inv.invoice_no}</td>
                      <td style={{ padding: 12, color: '#9ca3af', fontSize: 13 }}>{inv.project_name || '-'}</td>
                      <td style={{ padding: 12, color: '#9ca3af', fontSize: 13 }}>{inv.invoice_date}</td>
                      <td style={{ padding: 12, color: '#34d399', fontSize: 13, textAlign: 'right' }}>
                        {formatCurrency(inv.total)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500,
                            background:
                              inv.status === 'paid'
                                ? '#065f46'
                                : inv.status === 'sent'
                                ? '#1e40af'
                                : '#374151',
                            color: '#e5e7eb',
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowInvoicesModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  color: '#e5e7eb',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && customerToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setCustomerToDelete(null);
            }
          }}
        >
          <div
            style={{
              background: '#1f2937',
              borderRadius: 12,
              padding: 24,
              maxWidth: 420,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: '#ef4444', fontSize: 18 }}>
              Delete Customer
            </h3>
            <p style={{ margin: '0 0 16px', color: '#e5e7eb', fontSize: 14 }}>
              Are you sure you want to delete "{customerToDelete.name}"?
            </p>
            <p style={{ margin: '0 0 20px', color: '#9ca3af', fontSize: 13 }}>
              This action cannot be undone. If this customer has associated invoices, those invoices will retain the customer name but will no longer be linked to a customer record.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  color: '#e5e7eb',
                  fontSize: 14,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: deleting ? '#6b7280' : '#ef4444',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
