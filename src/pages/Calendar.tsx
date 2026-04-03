import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X, Clock, User, UserCheck, Activity } from 'lucide-react';
import socket from '../lib/socket.ts';

const localizer = momentLocalizer(moment);

interface Appointment {
  id: number;
  patientId: number;
  providerId: number;
  treatmentId: number | null;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  patient: { firstName: string; lastName: string };
  provider: { name: string };
  treatment: { name: string } | null;
}

interface Patient { id: number; firstName: string; lastName: string }
interface Provider { id: number; name: string }
interface Treatment { id: number; name: string; baseCost: number }

const Calendar: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    providerId: '',
    treatmentId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    fetchData();

    // WebSocket listeners
    socket.on('appointment_created', (newAppt: Appointment) => {
      setAppointments(prev => [...prev, newAppt].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
    });

    socket.on('appointment_updated', (updatedAppt: Appointment) => {
      setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
    });

    socket.on('appointment_deleted', (id: number) => {
      setAppointments(prev => prev.filter(a => a.id !== id));
    });

    return () => {
      socket.off('appointment_created');
      socket.off('appointment_updated');
      socket.off('appointment_deleted');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [apptsRes, patientsRes, providersRes, treatmentsRes] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/patients'),
        axios.get('/api/appointments/providers'),
        axios.get('/api/treatments')
      ]);
      setAppointments(apptsRes.data);
      setPatients(patientsRes.data);
      setProviders(providersRes.data);
      setTreatments(treatmentsRes.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setEditingAppointment(null);
    setFormData({
      patientId: '',
      providerId: '',
      treatmentId: '',
      startTime: moment(start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(end).format('YYYY-MM-DDTHH:mm'),
      status: 'scheduled',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    const appt = appointments.find(a => a.id === event.id);
    if (appt) {
      setEditingAppointment(appt);
      setFormData({
        patientId: appt.patientId.toString(),
        providerId: appt.providerId.toString(),
        treatmentId: appt.treatmentId?.toString() || '',
        startTime: moment(appt.startTime).format('YYYY-MM-DDTHH:mm'),
        endTime: moment(appt.endTime).format('YYYY-MM-DDTHH:mm'),
        status: appt.status,
        notes: appt.notes || ''
      });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await axios.put(`/api/appointments/${editingAppointment.id}`, formData);
      } else {
        await axios.post('/api/appointments', formData);
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving appointment:', err);
    }
  };

  const handleDelete = async () => {
    if (editingAppointment && window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await axios.delete(`/api/appointments/${editingAppointment.id}`);
        fetchData();
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error deleting appointment:', err);
      }
    }
  };

  const events = appointments.map(appt => ({
    id: appt.id,
    title: `${appt.patient.firstName} ${appt.patient.lastName} - ${appt.treatment?.name || 'Consultation'} (${appt.provider.name})`,
    start: new Date(appt.startTime),
    end: new Date(appt.endTime),
    status: appt.status
  }));

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#2563eb';
    if (event.status === 'completed') backgroundColor = '#10b981';
    if (event.status === 'cancelled') backgroundColor = '#ef4444';
    if (event.status === 'no-show') backgroundColor = '#64748b';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  if (loading) return <div>Loading schedule...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Schedule</h1>
        <button className="btn btn-primary" onClick={() => handleSelectSlot({ start: new Date(), end: moment().add(30, 'minutes').toDate() })}>
          <Plus size={18} /> New Appointment
        </button>
      </div>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        defaultView="week"
        views={['month', 'week', 'day', 'agenda']}
      />

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</h2>
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
                <label className="form-label"><UserCheck size={14} style={{ marginRight: '0.5rem' }} /> Provider</label>
                <select
                  className="form-control"
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                  required
                >
                  <option value="">Select Provider</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><Activity size={14} style={{ marginRight: '0.5rem' }} /> Treatment</label>
                <select
                  className="form-control"
                  value={formData.treatmentId}
                  onChange={(e) => setFormData({ ...formData, treatmentId: e.target.value })}
                >
                  <option value="">Select Treatment (Optional)</option>
                  {treatments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (${t.baseCost.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label"><Clock size={14} style={{ marginRight: '0.5rem' }} /> Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Clock size={14} style={{ marginRight: '0.5rem' }} /> End Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                {editingAppointment && (
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Appointment</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
