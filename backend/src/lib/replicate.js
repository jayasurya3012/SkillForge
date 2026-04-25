import Replicate from 'replicate';

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Generate a circuit diagram image from a text description
export async function generateCircuitImage(prompt) {
  const output = await replicate.run(
    'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
    {
      input: {
        prompt: `Technical circuit diagram, clean white background, ${prompt}, electronics schematic style`,
        negative_prompt: 'blurry, artistic, photorealistic, dark background',
        width: 768,
        height: 512,
        num_inference_steps: 30,
      },
    }
  );
  // output is an array of image URLs
  return output[0];
}
