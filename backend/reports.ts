import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../server.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Revenue by month
router.get('/revenue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM "Payment"
      WHERE status = 'completed'
      GROUP BY month
      ORDER BY month ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Appointment stats
router.get('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status = 'scheduled')       AS scheduled,
        COUNT(*) FILTER (WHERE status = 'completed')       AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')       AS cancelled,
        COUNT(*) FILTER (WHERE status = 'no-show')         AS "noShow"
      FROM "Appointment"
    `);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Treatment stats
router.get('/treatments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        t.name,
        COUNT(a.id)                                                        AS count,
        COUNT(a.id) FILTER (WHERE a.status = 'completed') * t."baseCost"  AS revenue
      FROM "Treatment" t
      LEFT JOIN "Appointment" a ON a."treatmentId" = t.id
      GROUP BY t.id, t.name, t."baseCost"
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [patients, appointments, revenue, treatments, recentActivity] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM "Patient"'),
      db.query('SELECT COUNT(*) as count FROM "Appointment"'),
      db.query(`SELECT COALESCE(SUM(amount), 0) as sum FROM "Payment" WHERE status = 'completed'`),
      db.query('SELECT COUNT(*) as count FROM "Treatment"'),
      db.query(`
        SELECT a.*,
          row_to_json(pat.*) as patient,
          row_to_json(pro.*) as provider,
          row_to_json(t.*)   as treatment
        FROM "Appointment" a
        LEFT JOIN "Patient"   pat ON pat.id = a."patientId"
        LEFT JOIN "Provider"  pro ON pro.id = a."providerId"
        LEFT JOIN "Treatment" t   ON t.id   = a."treatmentId"
        ORDER BY a."createdAt" DESC
        LIMIT 5
      `)
    ]);

    res.json({
      totalPatients:     parseInt(patients.rows[0].count),
      totalAppointments: parseInt(appointments.rows[0].count),
      totalRevenue:      parseFloat(revenue.rows[0].sum),
      totalTreatments:   parseInt(treatments.rows[0].count),
      recentActivity:    recentActivity.rows
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;