import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import authRoutes from './backend/auth.ts';
import patientRoutes from './backend/patients.ts';
import appointmentRoutes from './backend/appointments.ts';
import paymentRoutes from './backend/payments.ts';
import reportRoutes from './backend/reports.ts';
import treatmentRoutes from './backend/treatments.ts';



dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Connection Pool 
//running this in development
// export const db = new Pool({
//   host:     process.env.DB_HOST     || 'localhost',
//   port:     Number(process.env.DB_PORT) || 5432,
//   database: process.env.DB_NAME     || 'nmc',
//   user:     process.env.DB_USER     || 'postgres',
//   password: process.env.DB_PASSWORD || '',
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false 
//   }
// });

//run this in production
export const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Initialize Tables 
const initDB = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL,
      role        TEXT DEFAULT 'staff',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Patient" (
      id            SERIAL PRIMARY KEY,
      "firstName"   TEXT NOT NULL,
      "lastName"    TEXT NOT NULL,
      email         TEXT UNIQUE,
      phone         TEXT,
      "dateOfBirth" TIMESTAMP,
      address       TEXT,
      gender        TEXT,
      "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Provider" (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      specialty   TEXT,
      email       TEXT UNIQUE,
      phone       TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Treatment" (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      "baseCost"  REAL NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Appointment" (
      id            SERIAL PRIMARY KEY,
      "patientId"   INTEGER NOT NULL REFERENCES "Patient"(id),
      "providerId"  INTEGER NOT NULL REFERENCES "Provider"(id),
      "treatmentId" INTEGER REFERENCES "Treatment"(id),
      "startTime"   TIMESTAMP NOT NULL,
      "endTime"     TIMESTAMP NOT NULL,
      status        TEXT DEFAULT 'scheduled',
      notes         TEXT,
      "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "TreatmentRecord" (
      id            SERIAL PRIMARY KEY,
      "patientId"   INTEGER NOT NULL REFERENCES "Patient"(id),
      "treatmentId" INTEGER NOT NULL REFERENCES "Treatment"(id),
      date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      cost          REAL NOT NULL,
      notes         TEXT,
      "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Payment" (
      id          SERIAL PRIMARY KEY,
      "patientId" INTEGER NOT NULL REFERENCES "Patient"(id),
      amount      REAL NOT NULL,
      date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      method      TEXT DEFAULT 'cash',
      status      TEXT DEFAULT 'completed',
      notes       TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database tables ready');
};

// ─── Server ───────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initDB();
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }

  const app = express();
  const httpServer = createServer(app);

  const PORT = Number(process.env.PORT) || 3000;

  // ✅ Define allowed origins once
  const allowedOrigins = [
    'https://nmc-92674.web.app',
    'https://nmc-92674.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // ✅ CORS must be the VERY FIRST middleware
  app.use(cors(corsOptions));

  // ✅ Handle ALL preflight requests immediately (must be before routes)
  app.options('*', cors(corsOptions));

  // ✅ Socket.IO with same CORS config
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Other middleware AFTER cors
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Attach io to request
  app.use((req: any, res, next) => {
    req.io = io;
    next();
  });

  // WebSocket
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/treatments', treatmentRoutes);

  // Serve Vite frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});