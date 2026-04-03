import { Router, Request, Response } from 'express';
import db from './db.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Get all patients
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patients = db.prepare('SELECT * FROM Patient ORDER BY lastName ASC').all();
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create patient
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, address, gender } = req.body;
    const result = db.prepare(`
      INSERT INTO Patient (firstName, lastName, email, phone, dateOfBirth, address, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      address,
      gender
    );
    
    const patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(patient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, address, gender } = req.body;
    
    db.prepare(`
      UPDATE Patient 
      SET firstName = ?, lastName = ?, email = ?, phone = ?, dateOfBirth = ?, address = ?, gender = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      address,
      gender,
      parseInt(id)
    );
    
    const patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(parseInt(id));
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete patient
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM Patient WHERE id = ?').run(parseInt(id));
    res.json({ message: 'Patient deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
