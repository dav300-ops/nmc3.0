import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Stethoscope size={24} color="#3b82f6" />
        <span>Clinic CRM</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/patients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Patients</span>
        </NavLink>
        
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Schedule</span>
        </NavLink>

        <NavLink to="/treatments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Treatments</span>
        </NavLink>
        
        <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CreditCard size={20} />
          <span>Payments</span>
        </NavLink>
        
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          Logged in as: <strong>{user?.name}</strong>
        </div>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
