import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { router as authRouter } from './routes/auth';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Mount auth routes at root (nginx strips /auth prefix)
app.use('/', authRouter);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[auth-service error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`[auth-service] Listening on port ${PORT}`);
});
