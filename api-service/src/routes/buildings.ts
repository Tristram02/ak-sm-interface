import { Router, Response, NextFunction } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /buildings — list buildings owned by the authenticated user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, ip_address, port, device_user, created_at, updated_at
       FROM buildings WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /buildings — create a building
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, ip_address, port = 6080, device_user = '', device_password = '' } =
      req.body as {
        name: string;
        ip_address: string;
        port?: number;
        device_user?: string;
        device_password?: string;
      };

    if (!name || !ip_address) {
      res.status(400).json({ error: 'name and ip_address are required' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO buildings(user_id, name, ip_address, port, device_user, device_password)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id, name, ip_address, port, device_user, created_at`,
      [req.userId, name, ip_address, port, device_user, device_password]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /buildings/:id — update a building
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, ip_address, port, device_user, device_password } = req.body as {
      name?: string; ip_address?: string; port?: number;
      device_user?: string; device_password?: string;
    };

    const { rows } = await pool.query(
      `UPDATE buildings
       SET name            = COALESCE($1, name),
           ip_address      = COALESCE($2, ip_address),
           port            = COALESCE($3, port),
           device_user     = COALESCE($4, device_user),
           device_password = COALESCE($5, device_password)
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, ip_address, port, device_user, updated_at`,
      [name, ip_address, port, device_user, device_password, id, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Building not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /buildings/:id — delete a building (cascades to schemes)
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'DELETE FROM buildings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: 'Building not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router };
