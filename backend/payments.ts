import { Router, Request, Response } from 'express';
import db from './db.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all payments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const payments = db.prepare('SELECT * FROM Payment ORDER BY date DESC').all();
    const paymentsWithPatient = payments.map((payment: any) => {
      payment.patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(payment.patientId);
      return payment;
    });
    res.json(paymentsWithPatient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create payment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId, amount, date, method, status, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO Payment (patientId, amount, date, method, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      parseInt(patientId),
      parseFloat(amount),
      date ? new Date(date).toISOString() : new Date().toISOString(),
      method || 'cash',
      status || 'completed',
      notes
    );
    
    const payment: any = db.prepare('SELECT * FROM Payment WHERE id = ?').get(result.lastInsertRowid);
    payment.patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(payment.patientId);
    
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get payments for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const payments = db.prepare('SELECT * FROM Payment WHERE patientId = ? ORDER BY date DESC').all(parseInt(patientId));
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
