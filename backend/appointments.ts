import { Router, Request, Response } from 'express';
import db from './db.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Helper to get appointment with relations
const getAppointmentWithRelations = (id: number) => {
  const appointment: any = db.prepare('SELECT * FROM Appointment WHERE id = ?').get(id);
  if (!appointment) return null;
  
  appointment.patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(appointment.patientId);
  appointment.provider = db.prepare('SELECT * FROM Provider WHERE id = ?').get(appointment.providerId);
  appointment.treatment = appointment.treatmentId ? db.prepare('SELECT * FROM Treatment WHERE id = ?').get(appointment.treatmentId) : null;
  
  return appointment;
};

// Get all appointments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointments = db.prepare('SELECT * FROM Appointment ORDER BY startTime ASC').all();
    const appointmentsWithRelations = appointments.map((appt: any) => {
      appt.patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(appt.patientId);
      appt.provider = db.prepare('SELECT * FROM Provider WHERE id = ?').get(appt.providerId);
      appt.treatment = appt.treatmentId ? db.prepare('SELECT * FROM Treatment WHERE id = ?').get(appt.treatmentId) : null;
      return appt;
    });
    res.json(appointmentsWithRelations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create appointment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, providerId, treatmentId, startTime, endTime, status, notes } = req.body;
    
    const result = db.prepare(`
      INSERT INTO Appointment (patientId, providerId, treatmentId, startTime, endTime, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      parseInt(patientId),
      parseInt(providerId),
      treatmentId ? parseInt(treatmentId) : null,
      new Date(startTime).toISOString(),
      new Date(endTime).toISOString(),
      status || 'scheduled',
      notes
    );
    
    const appointment = getAppointmentWithRelations(Number(result.lastInsertRowid));
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('appointment_created', appointment);
    }
    
    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { patientId, providerId, treatmentId, startTime, endTime, status, notes } = req.body;
    
    db.prepare(`
      UPDATE Appointment 
      SET 
        patientId = COALESCE(?, patientId),
        providerId = COALESCE(?, providerId),
        treatmentId = ?,
        startTime = COALESCE(?, startTime),
        endTime = COALESCE(?, endTime),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      patientId ? parseInt(patientId) : null,
      providerId ? parseInt(providerId) : null,
      treatmentId !== undefined ? (treatmentId ? parseInt(treatmentId) : null) : undefined,
      startTime ? new Date(startTime).toISOString() : null,
      endTime ? new Date(endTime).toISOString() : null,
      status || null,
      notes || null,
      parseInt(id)
    );
    
    const appointment = getAppointmentWithRelations(parseInt(id));
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('appointment_updated', appointment);
    }
    
    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM Appointment WHERE id = ?').run(parseInt(id));
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('appointment_deleted', parseInt(id));
    }
    
    res.json({ message: 'Appointment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all providers
router.get('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const providers = db.prepare('SELECT * FROM Provider').all();
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create provider (helper)
router.post('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, specialty, email, phone } = req.body;
    const result = db.prepare(`
      INSERT INTO Provider (name, specialty, email, phone)
      VALUES (?, ?, ?, ?)
    `).run(name, specialty, email, phone);
    
    const provider = db.prepare('SELECT * FROM Provider WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(provider);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
