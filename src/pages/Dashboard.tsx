import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, DollarSign, Clock, ChevronRight, Activity } from 'lucide-react';
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
      <h1 className="page-title">Dashboard</h1>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon summary-icon--blue">
            <Users size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Patients</h3>
            <p>{summary?.totalPatients || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon summary-icon--yellow">
            <Calendar size={24} />
          </div>
          <div className="summary-info">
            <h3>Appointments</h3>
            <p>{summary?.totalAppointments || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon summary-icon--green">
            <DollarSign size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Revenue</h3>
            <p>${summary?.totalRevenue.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon summary-icon--indigo">
            <Activity size={24} />
          </div>
          <div className="summary-info">
            <h3>Treatments</h3>
            <p>{summary?.totalTreatments || 0}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
          <Link to="/calendar" className="card-header-link">
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
                    <div className="time-cell">
                      <Clock size={14} color="var(--text-muted)" />
                      {new Date(activity.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${activity.status}`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
              {summary?.recentActivity.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-empty">No recent activity</td>
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