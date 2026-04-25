import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import chatRoutes from './routes/chat.js';
import tutorialRoutes from './routes/tutorials.js';
import componentRoutes from './routes/components.js';
import sessionRoutes from './routes/sessions.js';
import imageRoutes from './routes/images.js';
import videoRoutes from './routes/videos.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5175',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Rate limiting
app.use('/api/chat', rateLimit({ windowMs: 60_000, max: 30 }));
app.use('/api/images', rateLimit({ windowMs: 60_000, max: 10 }));
app.use('/api/videos', rateLimit({ windowMs: 60_000, max: 20 }));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SkillForge backend running on :${PORT}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5175'}`);
});
