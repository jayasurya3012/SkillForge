import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { randomUUID } from 'crypto';

const router = Router();

// POST /api/sessions — create or resume a session
router.post('/', async (req, res) => {
  const { userId, tutorialId } = req.body;

  try {
    // Try to find existing session
    const { rows: [existing] } = await db.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND tutorial_id = $2',
      [userId, tutorialId]
    );

    if (existing) return res.json(existing);

    // Create new session
    const sessionId = randomUUID();
    const { rows: [session] } = await db.query(
      `INSERT INTO sessions (id, user_id, tutorial_id, current_step, circuit_state)
       VALUES ($1, $2, $3, 1, $4) RETURNING *`,
      [sessionId, userId, tutorialId, JSON.stringify({})]
    );

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: [session] } = await db.query(
      'SELECT * FROM sessions WHERE id = $1', [req.params.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// PATCH /api/sessions/:id/progress — save current step + circuit state
router.patch('/:id/progress', async (req, res) => {
  const { currentStep, circuitState } = req.body;

  try {
    const { rows: [session] } = await db.query(
      `UPDATE sessions SET current_step = $1, circuit_state = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [currentStep, JSON.stringify(circuitState), req.params.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

export default router;
