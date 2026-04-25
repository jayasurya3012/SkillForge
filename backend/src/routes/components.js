import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

// GET /api/components — full library, optional ?category=sensors
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category
      ? 'SELECT * FROM components WHERE category = $1 ORDER BY name'
      : 'SELECT * FROM components ORDER BY category, name';
    const { rows } = await db.query(query, category ? [category] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

// GET /api/components/:id — single component with pin definitions
router.get('/:id', async (req, res) => {
  try {
    const { rows: [component] } = await db.query(
      'SELECT * FROM components WHERE id = $1', [req.params.id]
    );
    if (!component) return res.status(404).json({ error: 'Component not found' });
    res.json(component);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

export default router;
