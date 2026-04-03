import { Router, Request, Response } from 'express';
import db from './db.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// Revenue report (revenue over time)
router.get('/revenue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const revenueByMonth = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as amount
      FROM Payment
      WHERE status = 'completed'
      GROUP BY month
      ORDER BY month ASC
    `).all();

    res.json(revenueByMonth);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Appointment stats report
router.get('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const appointments: any[] = db.prepare('SELECT status FROM Appointment').all();

    const stats = {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'no-show').length,
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Treatment stats report
router.get('/treatments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const treatments: any[] = db.prepare('SELECT * FROM Treatment').all();
    
    const report = treatments.map(t => {
      const appointments: any[] = db.prepare('SELECT status FROM Appointment WHERE treatmentId = ?').all(t.id);
      return {
        name: t.name,
        count: appointments.length,
        revenue: appointments.filter(a => a.status === 'completed').length * t.baseCost
      };
    }).sort((a, b) => b.count - a.count);

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patientCount: any = db.prepare('SELECT COUNT(*) as count FROM Patient').get();
    const appointmentCount: any = db.prepare('SELECT COUNT(*) as count FROM Appointment').get();
    const totalRevenue: any = db.prepare("SELECT SUM(amount) as sum FROM Payment WHERE status = 'completed'").get();
    const treatmentCount: any = db.prepare('SELECT COUNT(*) as count FROM Treatment').get();

    const recentActivity = db.prepare(`
      SELECT * FROM Appointment 
      ORDER BY createdAt DESC 
      LIMIT 5
    `).all();
    
    const recentActivityWithRelations = recentActivity.map((appt: any) => {
      appt.patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(appt.patientId);
      appt.provider = db.prepare('SELECT * FROM Provider WHERE id = ?').get(appt.providerId);
      appt.treatment = appt.treatmentId ? db.prepare('SELECT * FROM Treatment WHERE id = ?').get(appt.treatmentId) : null;
      return appt;
    });

    res.json({
      totalPatients: patientCount.count,
      totalAppointments: appointmentCount.count,
      totalRevenue: totalRevenue.sum || 0,
      totalTreatments: treatmentCount.count,
      recentActivity: recentActivityWithRelations
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
