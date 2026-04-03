import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../server.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all treatments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM "Treatment" ORDER BY name ASC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create treatment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, baseCost } = req.body;
    const result = await db.query(
      `INSERT INTO "Treatment" (name, description, "baseCost") VALUES ($1, $2, $3) RETURNING *`,
      [name, description, parseFloat(baseCost)]
    );
    const treatment = result.rows[0];
    if ((req as any).io) (req as any).io.emit('treatment_created', treatment);
    res.status(201).json(treatment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update treatment
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, baseCost } = req.body;
    const result = await db.query(
      `UPDATE "Treatment"
       SET name = $1, description = $2, "baseCost" = $3, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [name, description, parseFloat(baseCost), parseInt(id)]
    );
    const treatment = result.rows[0];
    if ((req as any).io) (req as any).io.emit('treatment_updated', treatment);
    res.json(treatment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete treatment
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM "Treatment" WHERE id = $1', [parseInt(id)]);
    if ((req as any).io) (req as any).io.emit('treatment_deleted', id);
    res.json({ message: 'Treatment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;