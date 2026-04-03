import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../server.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Helper to get appointment with relations
const getAppointmentWithRelations = async (id: number) => {
  const result = await db.query(`
    SELECT a.*,
      row_to_json(pat.*) as patient,
      row_to_json(pro.*) as provider,
      row_to_json(t.*)  as treatment
    FROM "Appointment" a
    LEFT JOIN "Patient"   pat ON pat.id = a."patientId"
    LEFT JOIN "Provider"  pro ON pro.id = a."providerId"
    LEFT JOIN "Treatment" t   ON t.id   = a."treatmentId"
    WHERE a.id = $1
  `, [id]);
  return result.rows[0] || null;
};

// Get all appointments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT a.*,
        row_to_json(pat.*) as patient,
        row_to_json(pro.*) as provider,
        row_to_json(t.*)  as treatment
      FROM "Appointment" a
      LEFT JOIN "Patient"   pat ON pat.id = a."patientId"
      LEFT JOIN "Provider"  pro ON pro.id = a."providerId"
      LEFT JOIN "Treatment" t   ON t.id   = a."treatmentId"
      ORDER BY a."startTime" ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create appointment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, providerId, treatmentId, startTime, endTime, status, notes } = req.body;

    const result = await db.query(
      `INSERT INTO "Appointment" ("patientId", "providerId", "treatmentId", "startTime", "endTime", status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        parseInt(patientId),
        parseInt(providerId),
        treatmentId ? parseInt(treatmentId) : null,
        new Date(startTime),
        new Date(endTime),
        status || 'scheduled',
        notes || null
      ]
    );

    const appointment = await getAppointmentWithRelations(result.rows[0].id);
    if ((req as any).io) (req as any).io.emit('appointment_created', appointment);
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

    await db.query(
      `UPDATE "Appointment"
       SET
         "patientId"   = COALESCE($1, "patientId"),
         "providerId"  = COALESCE($2, "providerId"),
         "treatmentId" = $3,
         "startTime"   = COALESCE($4, "startTime"),
         "endTime"     = COALESCE($5, "endTime"),
         status        = COALESCE($6, status),
         notes         = COALESCE($7, notes),
         "updatedAt"   = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        patientId  ? parseInt(patientId)  : null,
        providerId ? parseInt(providerId) : null,
        treatmentId !== undefined ? (treatmentId ? parseInt(treatmentId) : null) : undefined,
        startTime  ? new Date(startTime)  : null,
        endTime    ? new Date(endTime)    : null,
        status     || null,
        notes      || null,
        parseInt(id)
      ]
    );

    const appointment = await getAppointmentWithRelations(parseInt(id));
    if ((req as any).io) (req as any).io.emit('appointment_updated', appointment);
    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM "Appointment" WHERE id = $1', [parseInt(id)]);
    if ((req as any).io) (req as any).io.emit('appointment_deleted', parseInt(id));
    res.json({ message: 'Appointment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all providers
router.get('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM "Provider"');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create provider
router.post('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, specialty, email, phone } = req.body;
    const result = await db.query(
      `INSERT INTO "Provider" (name, specialty, email, phone) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, specialty, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;