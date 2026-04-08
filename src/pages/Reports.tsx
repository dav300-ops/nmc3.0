import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp, PieChart, Calendar,
  CheckCircle2, XCircle, AlertCircle, Activity
} from 'lucide-react';

interface RevenueData { month: string; amount: number; }
interface AppointmentStats {
  total: number; scheduled: number;
  completed: number; cancelled: number; noShow: number;
}
interface TreatmentStats { name: string; count: number; revenue: number; }

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
      <h1 className="page-title">Reports</h1>

      <div className="reports-grid">

        <div className="card">
          <div className="card-section-header">
            <TrendingUp size={20} color="var(--primary-color)" />
            <h2 className="card-title">Revenue Over Time</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="th-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((item) => (
                  <tr key={item.month}>
                    <td>{item.month}</td>
                    <td className="td-right td-bold">${item.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {revenue.length === 0 && (
                  <tr><td colSpan={2} className="table-empty">No revenue data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-section-header">
            <PieChart size={20} color="var(--primary-color)" />
            <h2 className="card-title">Appointment Statistics</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-box stat-box--neutral">
              <div className="stat-box__label">Total</div>
              <div className="stat-box__value">{stats?.total || 0}</div>
            </div>
            <div className="stat-box stat-box--green">
              <div className="stat-box__label">Completed</div>
              <div className="stat-box__value">{stats?.completed || 0}</div>
            </div>
            <div className="stat-box stat-box--red">
              <div className="stat-box__label">Cancelled</div>
              <div className="stat-box__value">{stats?.cancelled || 0}</div>
            </div>
            <div className="stat-box stat-box--yellow">
              <div className="stat-box__label">No Show</div>
              <div className="stat-box__value">{stats?.noShow || 0}</div>
            </div>
          </div>

          <div className="breakdown-section">
            <h3 className="breakdown-title">Breakdown</h3>
            <div className="breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-item__label">
                  <Calendar size={16} color="var(--primary-color)" /> Scheduled
                </div>
                <span className="breakdown-item__value">{stats?.scheduled || 0}</span>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-item__label">
                  <CheckCircle2 size={16} color="#10b981" /> Completed
                </div>
                <span className="breakdown-item__value">{stats?.completed || 0}</span>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-item__label">
                  <XCircle size={16} color="#ef4444" /> Cancelled
                </div>
                <span className="breakdown-item__value">{stats?.cancelled || 0}</span>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-item__label">
                  <AlertCircle size={16} color="#f59e0b" /> No Show
                </div>
                <span className="breakdown-item__value">{stats?.noShow || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-section-header">
            <Activity size={20} color="var(--primary-color)" />
            <h2 className="card-title">Treatment Popularity</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th className="th-center">Appointments</th>
                  <th className="th-right">Est. Revenue</th>
                </tr>
              </thead>
              <tbody>
                {treatmentStats.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td className="td-center">{item.count}</td>
                    <td className="td-right td-bold">${item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {treatmentStats.length === 0 && (
                  <tr><td colSpan={3} className="table-empty">No treatment data available</td></tr>
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