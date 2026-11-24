import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// The legacy API is optional and is not used by the local Android alarm.
const configured = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'OPENAI_API_KEY']
  .every(name => Boolean(process.env[name]));
if (configured) {
  app.use('/api/auth', require('./routes/auth.routes').default);
  app.use('/api/alarms', require('./routes/alarm.routes').default);
  app.use('/api/preferences', require('./routes/preferences.routes').default);
  app.use('/api/ai', require('./routes/ai.routes').default);
  app.use('/api/journal', require('./routes/journal.routes').default);
  app.use('/api/vapi', require('./routes/vapi.routes').default);
  app.use('/api/voice-journal', require('./routes/voiceJournal.routes').default);
  app.use('/api/goals', require('./routes/goals.routes').default);
  app.use('/api/analytics', require('./routes/analytics.routes').default);
} else {
  app.use('/api', (_req, res) => res.status(503).json({ error: 'Backend providers are not configured.' }));
}

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  if (!configured) console.log('Backend providers are not configured; local Android alarms do not need them.');
  else void require('./config/weaviate').initializeSchema();
});
