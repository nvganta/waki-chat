import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import alarmRoutes from './routes/alarm.routes';
import preferencesRoutes from './routes/preferences.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import journalRoutes from './routes/journal.routes';
import vapiRoutes from './routes/vapi.routes';
import voiceJournalRoutes from './routes/voiceJournal.routes';
import goalsRoutes from './routes/goals.routes';
import analyticsRoutes from './routes/analytics.routes';
import { initializeSchema } from './config/weaviate';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for audio uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/vapi', vapiRoutes);
app.use('/api/voice-journal', voiceJournalRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  // Initialize Weaviate schema
  await initializeSchema();
});