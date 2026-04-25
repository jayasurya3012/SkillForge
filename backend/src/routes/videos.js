import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const GenerateSchema = z.object({
  prompt: z.string().min(5).max(500),
});

// POST /api/videos/generate — generate a short tutorial video via OpenAI Sora REST API
router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  try {
    console.log('Generating video with Sora:', parsed.data.prompt.substring(0, 80) + '...');

    // Start the video generation job
    const createRes = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt: parsed.data.prompt,
        size: '1280x720',
        seconds: '8',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Sora create failed:', createRes.status, err);
      return res.status(createRes.status).json({ error: `Sora API error: ${err}` });
    }

    const video = await createRes.json();
    console.log('Sora job started:', video.id, 'status:', video.status);

    // Poll until completed (max ~5 minutes)
    let result = video;
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'completed' || result.status === 'failed') break;

      await new Promise(r => setTimeout(r, 10000));

      const statusRes = await fetch(`https://api.openai.com/v1/videos/${video.id}`, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      });

      if (statusRes.ok) {
        result = await statusRes.json();
        console.log(`Sora job ${video.id}: ${result.status} (${result.progress ?? 0}%)`);
      }
    }

    if (result.status !== 'completed') {
      console.error('Sora job did not complete:', result.status);
      return res.status(500).json({ error: `Video generation ${result.status}` });
    }

    console.log('Video completed:', video.id);
    res.json({ videoId: video.id });
  } catch (err) {
    console.error('Video generation failed:', err);
    res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// GET /api/videos/:id/content — proxy the video content from OpenAI
router.get('/:id/content', async (req, res) => {
  try {
    const response = await fetch(`https://api.openai.com/v1/videos/${req.params.id}/content`, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch video' });
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Video proxy failed:', err);
    res.status(500).json({ error: 'Failed to proxy video' });
  }
});

export default router;
