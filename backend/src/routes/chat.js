import { Router } from 'express';
import { z } from 'zod';
import { groq, SYSTEM_PROMPT } from '../lib/groq.js';
import { getChatHistory, saveChatHistory } from '../lib/redis.js';

const router = Router();

const MessageSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(1000),
  context: z.object({
    tutorialId: z.string().optional(),
    currentStep: z.number().optional(),
  }).optional(),
});

// POST /api/chat — streaming chat with Groq
router.post('/', async (req, res) => {
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { sessionId, message, context } = parsed.data;

  try {
    const history = await getChatHistory(sessionId);

    // Inject tutorial context into system prompt if available
    let systemPrompt = SYSTEM_PROMPT;
    if (context?.tutorialId && context?.currentStep !== undefined) {
      systemPrompt += `\n\nCurrent tutorial: ${context.tutorialId}, Step: ${context.currentStep}.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages,
      stream: true,
      max_tokens: 512,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    // Save updated history
    await saveChatHistory(sessionId, [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: fullResponse },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;
