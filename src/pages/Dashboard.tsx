import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Summary {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalTreatments: number;
  recentActivity: any[];
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('/api/reports/summary');
        setSummary(response.data);
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h1>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Patients</h3>
            <p>{summary?.totalPatients || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Calendar size={24} />
          </div>
          <div className="summary-info">
            <h3>Appointments</h3>
            <p>{summary?.totalAppointments || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <DollarSign size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Revenue</h3>
            <p>${summary?.totalRevenue.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            <Activity size={24} />
          </div>
          <div className="summary-info">
            <h3>Treatments</h3>
            <p>{summary?.totalTreatments || 0}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Recent Activity</h2>
          <Link to="/calendar" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Treatment</th>
                <th>Provider</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.patient.firstName} {activity.patient.lastName}</td>
                  <td>{activity.treatment?.name || 'Consultation'}</td>
                  <td>{activity.provider.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      {new Date(activity.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      backgroundColor: activity.status === 'completed' ? '#d1fae5' : activity.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                      color: activity.status === 'completed' ? '#065f46' : activity.status === 'cancelled' ? '#991b1b' : '#92400e'
                    }}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
              {summary?.recentActivity.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
