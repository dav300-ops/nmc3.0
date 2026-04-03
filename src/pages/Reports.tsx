import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  PieChart, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Activity
} from 'lucide-react';

interface RevenueData {
  month: string;
  amount: number;
}

interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

interface TreatmentStats {
  name: string;
  count: number;
  revenue: number;
}

const Reports: React.FC = () => {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [treatmentStats, setTreatmentStats] = useState<TreatmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, statsRes, treatRes] = await Promise.all([
          axios.get('/api/reports/revenue'),
          axios.get('/api/reports/appointments'),
          axios.get('/api/reports/treatments')
        ]);
        setRevenue(revRes.data);
        setStats(statsRes.data);
        setTreatmentStats(treatRes.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} color="var(--primary-color)" />
            <h2 className="card-title" style={{ marginBottom: 0 }}>Revenue Over Time</h2>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((item) => (
                  <tr key={item.month}>
                    <td>{item.month}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>${item.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {revenue.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No revenue data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieChart size={20} color="var(--primary-color)" />
            <h2 className="card-title" style={{ marginBottom: 0 }}>Appointment Statistics</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.total || 0}</div>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: '#065f46', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Completed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>{stats?.completed || 0}</div>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Cancelled</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{stats?.cancelled || 0}</div>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '0.5rem' }}>No Show</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>{stats?.noShow || 0}</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Calendar size={16} color="var(--primary-color)" /> Scheduled
                </div>
                <span style={{ fontWeight: '600' }}>{stats?.scheduled || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Completed
                </div>
                <span style={{ fontWeight: '600' }}>{stats?.completed || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <XCircle size={16} color="#ef4444" /> Cancelled
                </div>
                <span style={{ fontWeight: '600' }}>{stats?.cancelled || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} color="#f59e0b" /> No Show
                </div>
                <span style={{ fontWeight: '600' }}>{stats?.noShow || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Activity size={20} color="var(--primary-color)" />
            <h2 className="card-title" style={{ marginBottom: 0 }}>Treatment Popularity</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th style={{ textAlign: 'center' }}>Appointments</th>
                  <th style={{ textAlign: 'right' }}>Est. Revenue</th>
                </tr>
              </thead>
              <tbody>
                {treatmentStats.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.count}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>${item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {treatmentStats.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No treatment data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
