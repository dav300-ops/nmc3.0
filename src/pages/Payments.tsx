import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  User,
  X
} from 'lucide-react';

interface Payment {
  id: number;
  patientId: number;
  amount: number;
  date: string;
  method: string;
  status: string;
  notes: string | null;
  patient: { firstName: string; lastName: string };
}

interface Patient { id: number; firstName: string; lastName: string }

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    status: 'completed',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, patientsRes] = await Promise.all([
        axios.get('/api/payments'),
        axios.get('/api/patients')
      ]);
      setPayments(paymentsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error fetching payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      patientId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      status: 'completed',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments', formData);
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Payments</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: '500' }}>{payment.patient.firstName} {payment.patient.lastName}</td>
                  <td style={{ color: 'var(--success-color)', fontWeight: '600' }}>
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                      <CreditCard size={14} color="var(--text-muted)" />
                      {payment.method}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      backgroundColor: payment.status === 'completed' ? '#d1fae5' : '#fef3c7',
                      color: payment.status === 'completed' ? '#065f46' : '#92400e'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label"><User size={14} style={{ marginRight: '0.5rem' }} /> Patient</label>
                <select
                  className="form-control"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><DollarSign size={14} style={{ marginRight: '0.5rem' }} /> Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} style={{ marginRight: '0.5rem' }} /> Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Method</label>
                <select
                  className="form-control"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
