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

// ── Scheme list ───────────────────────────────────────────────────────────────

// GET /buildings/:buildingId/schemes
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { rows } = await pool.query(
      `SELECT id, name, rows, cols, rooms, grid_opacity, objects, created_at, updated_at
       FROM schemes WHERE building_id = $1 ORDER BY created_at ASC`,
      [req.params.buildingId]
    );
    // Never return pdf_data in list (too large)
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /buildings/:buildingId/schemes
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const {
      name = 'Schemat',
      rows: gridRows = 10,
      cols: gridCols = 12,
      rooms = [],
      grid_opacity = 0.5,
      objects = [],
    } = req.body as {
      name?: string; rows?: number; cols?: number; rooms?: unknown[];
      grid_opacity?: number; objects?: unknown[];
    };

    const { rows } = await pool.query(
      `INSERT INTO schemes(building_id, name, rows, cols, rooms, grid_opacity, objects)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, name, rows, cols, rooms, grid_opacity, objects, created_at, updated_at`,
      [req.params.buildingId, name, gridRows, gridCols, JSON.stringify(rooms), grid_opacity, JSON.stringify(objects)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── Single scheme ─────────────────────────────────────────────────────────────

// GET /buildings/:buildingId/schemes/:id  — includes pdf_data
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { rows } = await pool.query(
      `SELECT id, name, rows, cols, rooms, grid_opacity, objects, pdf_data, created_at, updated_at
       FROM schemes WHERE id=$1 AND building_id=$2`,
      [req.params.id, req.params.buildingId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Scheme not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /buildings/:buildingId/schemes/:id — full update (auto-save)
// Accepts any combination of: name, rows, cols, rooms, grid_opacity, objects, pdf_data
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!await getBuilding(req.params.buildingId, req.userId!)) {
      res.status(404).json({ error: 'Building not found' }); return;
    }
    const { name, rows: gridRows, cols: gridCols, rooms, grid_opacity, objects, pdf_data } = req.body as {
      name?: string; rows?: number; cols?: number; rooms?: unknown[];
      grid_opacity?: number; objects?: unknown[]; pdf_data?: string;
    };
    const { rows } = await pool.query(
      `UPDATE schemes
       SET name         = COALESCE($1, name),
           rows         = COALESCE($2, rows),
           cols         = COALESCE($3, cols),
           rooms        = COALESCE($4::jsonb, rooms),
           grid_opacity = COALESCE($5, grid_opacity),
           objects      = COALESCE($6::jsonb, objects),
           pdf_data     = COALESCE($7, pdf_data)
       WHERE id = $8 AND building_id = $9
       RETURNING id, name, rows, cols, rooms, grid_opacity, objects, updated_at`,
      [
        name ?? null,
        gridRows ?? null,
        gridCols ?? null,
        rooms ? JSON.stringify(rooms) : null,
        grid_opacity ?? null,
        objects ? JSON.stringify(objects) : null,
        pdf_data ?? null,
        req.params.id,
        req.params.buildingId,
      ]
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
