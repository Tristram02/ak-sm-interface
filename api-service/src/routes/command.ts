import { Router, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import https from 'https';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

const selfSignedAgent = new https.Agent({ rejectUnauthorized: false });

// POST /buildings/:buildingId/command
// Body: raw XML string; Content-Type: application/xml
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT ip_address, port, device_user, device_password
       FROM buildings WHERE id = $1 AND user_id = $2`,
      [req.params.buildingId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Building not found' }); return; }

    const { ip_address, port, device_user, device_password } = rows[0] as {
      ip_address: string; port: number;
      device_user: string | null; device_password: string | null;
    };

    // 2. Read raw XML from request body (string)
    let xmlBody = req.body as string;
    if (!xmlBody) { res.status(400).json({ error: 'XML body is required' }); return; }

    // 3. Inject device credentials into <cmd ...> tag if configured
    if (device_user || device_password) {
      const creds = `user="${device_user ?? ''}" pass="${device_password ?? ''}"`;
      xmlBody = xmlBody.replace(/(<cmd\b)/, `$1 ${creds}`);
    }

    // 4. Forward to device — use https agent to accept self-signed TLS certs
    const endpoint = `https://${ip_address}:${port}/html/xml.cgi`;
    const deviceRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlBody,
      agent: selfSignedAgent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeout: 10000,
    } as any);

    const responseText = await deviceRes.text();
    res.status(deviceRes.status).type('application/xml').send(responseText);
  } catch (err) {
    // Surface the real error message so it's visible in the UI
    const message = err instanceof Error ? err.message : String(err);
    console.error('[command proxy error]', message);
    next(err);
  }
});

export { router };
