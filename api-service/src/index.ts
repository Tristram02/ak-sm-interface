import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { router as buildingsRouter } from './routes/buildings';
import { router as schemesRouter } from './routes/schemes';
import { router as commandRouter } from './routes/command';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
// Also parse raw text for XML command bodies
app.use('/buildings/:buildingId/command', express.text({ type: 'application/xml' }));

// Routes
app.use('/buildings', buildingsRouter);
app.use('/buildings/:buildingId/schemes', schemesRouter);
app.use('/buildings/:buildingId/command', commandRouter);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api-service error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT ?? '3002', 10);
app.listen(PORT, () => {
  console.log(`[api-service] Listening on port ${PORT}`);
});
