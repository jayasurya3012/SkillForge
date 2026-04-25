import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.error('Redis error:', err));

await client.connect();

export const redis = client;

// Chat history helpers
export async function getChatHistory(sessionId) {
  const data = await redis.get(`chat:${sessionId}`);
  return data ? JSON.parse(data) : [];
}

export async function saveChatHistory(sessionId, messages) {
  // Keep last 20 messages, expire after 2 hours
  await redis.setEx(`chat:${sessionId}`, 7200, JSON.stringify(messages.slice(-20)));
}
