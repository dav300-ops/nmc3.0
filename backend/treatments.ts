import { Router, Request, Response } from 'express';
import db from './db.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all treatments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const treatments = db.prepare('SELECT * FROM Treatment ORDER BY name ASC').all();
    res.json(treatments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create treatment
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, baseCost } = req.body;
    
    const result = db.prepare(`
      INSERT INTO Treatment (name, description, baseCost)
      VALUES (?, ?, ?)
    `).run(name, description, parseFloat(baseCost));
    
    const newTreatment = db.prepare('SELECT * FROM Treatment WHERE id = ?').get(result.lastInsertRowid);
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('treatment_created', newTreatment);
    }
    
    res.status(201).json(newTreatment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update treatment
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, baseCost } = req.body;
    
    db.prepare(`
      UPDATE Treatment 
      SET name = ?, description = ?, baseCost = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, parseFloat(baseCost), parseInt(id));
    
    const updatedTreatment = db.prepare('SELECT * FROM Treatment WHERE id = ?').get(parseInt(id));
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('treatment_updated', updatedTreatment);
    }
    
    res.json(updatedTreatment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete treatment
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    db.prepare('DELETE FROM Treatment WHERE id = ?').run(parseInt(id));
    
    // Emit WebSocket event
    if ((req as any).io) {
      (req as any).io.emit('treatment_deleted', id);
    }
    
    res.json({ message: 'Treatment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
