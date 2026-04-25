import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';

const router = Router();

// GET /api/tutorials — list all tutorials
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, title, description, difficulty, total_steps FROM tutorials ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutorials' });
  }
});

// GET /api/tutorials/:id — tutorial with all steps
router.get('/:id', async (req, res) => {
  try {
    const { rows: [tutorial] } = await db.query(
      'SELECT * FROM tutorials WHERE id = $1', [req.params.id]
    );
    if (!tutorial) return res.status(404).json({ error: 'Tutorial not found' });

    const { rows: steps } = await db.query(
      'SELECT * FROM tutorial_steps WHERE tutorial_id = $1 ORDER BY step_number ASC',
      [req.params.id]
    );

    res.json({ ...tutorial, steps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutorial' });
  }
});

// GET /api/tutorials/:id/steps/:step
router.get('/:id/steps/:step', async (req, res) => {
  try {
    const { rows: [step] } = await db.query(
      'SELECT * FROM tutorial_steps WHERE tutorial_id = $1 AND step_number = $2',
      [req.params.id, req.params.step]
    );
    if (!step) return res.status(404).json({ error: 'Step not found' });
    res.json(step);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch step' });
  }
});

// POST /api/tutorials/:id/steps/:step/validate
// Validates the user's circuit state against expected wiring for this step
router.post('/:id/steps/:step/validate', async (req, res) => {
  const { connections } = req.body; // array of { from, to } wire connections

  try {
    const { rows: [step] } = await db.query(
      'SELECT expected_connections FROM tutorial_steps WHERE tutorial_id = $1 AND step_number = $2',
      [req.params.id, req.params.step]
    );
    if (!step) return res.status(404).json({ error: 'Step not found' });

    const expected = step.expected_connections; // JSON array stored in DB
    const passed = validateConnections(connections, expected);

    res.json({
      passed,
      feedback: passed
        ? 'Correct! Great job wiring that up.'
        : `Not quite. Make sure you connect ${expected[0]?.from} to ${expected[0]?.to}.`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

function validateConnections(userConnections = [], expected = []) {
  return expected.every(({ from, to }) =>
    userConnections.some(
      (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    )
  );
}

export default router;
