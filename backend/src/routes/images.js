import { Router } from 'express';
import { z } from 'zod';
import { generateCircuitImage } from '../lib/replicate.js';

const router = Router();

const GenerateSchema = z.object({
  prompt: z.string().min(5).max(300),
});

// POST /api/images/generate — generate a circuit diagram via Replicate
router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const imageUrl = await generateCircuitImage(parsed.data.prompt);
    res.json({ url: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

export default router;
