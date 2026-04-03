import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../server.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all patients
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM "Patient" ORDER BY "lastName" ASC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create patient
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, address, gender } = req.body;
    const result = await db.query(
      `INSERT INTO "Patient" ("firstName", "lastName", email, phone, "dateOfBirth", address, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [firstName, lastName, email, phone, dateOfBirth || null, address, gender]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, address, gender } = req.body;

    const result = await db.query(
      `UPDATE "Patient"
       SET "firstName" = $1, "lastName" = $2, email = $3, phone = $4,
           "dateOfBirth" = $5, address = $6, gender = $7, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [firstName, lastName, email, phone, dateOfBirth || null, address, gender, parseInt(id)]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete patient
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM "Patient" WHERE id = $1', [parseInt(id)]);
    res.json({ message: 'Patient deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;