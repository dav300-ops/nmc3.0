import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../server.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all payments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT p.*, row_to_json(pat.*) as patient
      FROM "Payment" p
      LEFT JOIN "Patient" pat ON pat.id = p."patientId"
      ORDER BY p.date DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create payment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, amount, date, method, status, notes } = req.body;

    const result = await db.query(
      `INSERT INTO "Payment" ("patientId", amount, date, method, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        parseInt(patientId),
        parseFloat(amount),
        date ? new Date(date) : new Date(),
        method || 'cash',
        status || 'completed',
        notes || null
      ]
    );

    const payment = await db.query(`
      SELECT p.*, row_to_json(pat.*) as patient
      FROM "Payment" p
      LEFT JOIN "Patient" pat ON pat.id = p."patientId"
      WHERE p.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(payment.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get payments for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      'SELECT * FROM "Payment" WHERE "patientId" = $1 ORDER BY date DESC',
      [parseInt(patientId)]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;