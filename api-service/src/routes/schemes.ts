import { Router, Response, NextFunction } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

/** Verify the building belongs to the requesting user */
async function getBuilding(buildingId: string, userId: number) {
  const { rows } = await pool.query(
    'SELECT id FROM buildings WHERE id = $1 AND user_id = $2',
    [buildingId, userId]
  );
  return rows[0] ?? null;
}

// GET /buildings/:buildingId/schemes
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { rows } = await pool.query(
      `SELECT id, name, rows, cols, rooms, created_at, updated_at
       FROM schemes WHERE building_id = $1 ORDER BY created_at ASC`,
      [req.params.buildingId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});


// POST /buildings/:buildingId/schemes
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { name = 'Schemat', rows: gridRows = 10, cols: gridCols = 12, rooms = [] } =
      req.body as { name?: string; rows?: number; cols?: number; rooms?: unknown[] };

    const { rows } = await pool.query(
      `INSERT INTO schemes(building_id, name, rows, cols, rooms)
       VALUES($1,$2,$3,$4,$5)
       RETURNING id, name, rows, cols, rooms, created_at, updated_at`,
      [req.params.buildingId, name, gridRows, gridCols, JSON.stringify(rooms)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /buildings/:buildingId/schemes/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { rows } = await pool.query(
      'SELECT id, name, rows, cols, rooms, created_at, updated_at FROM schemes WHERE id=$1 AND building_id=$2',
      [req.params.id, req.params.buildingId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Scheme not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /buildings/:buildingId/schemes/:id — full update (auto-save)
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { name, rows: gridRows, cols: gridCols, rooms } = req.body as {
      name?: string; rows?: number; cols?: number; rooms?: unknown[];
    };
    const { rows } = await pool.query(
      `UPDATE schemes
       SET name  = COALESCE($1, name),
           rows  = COALESCE($2, rows),
           cols  = COALESCE($3, cols),
           rooms = COALESCE($4::jsonb, rooms)
       WHERE id = $5 AND building_id = $6
       RETURNING id, name, rows, cols, rooms, updated_at`,
      [name, gridRows, gridCols, rooms ? JSON.stringify(rooms) : null, req.params.id, req.params.buildingId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Scheme not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /buildings/:buildingId/schemes/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const result = await pool.query(
      'DELETE FROM schemes WHERE id=$1 AND building_id=$2',
      [req.params.id, req.params.buildingId]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: 'Scheme not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router };
