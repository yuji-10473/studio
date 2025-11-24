
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

import '@/ai/flows/generate-character-persona.ts';
import '@/ai/flows/dynamic-character-introduction.ts';
import '@/ai/flows/generate-new-character.ts';
import '@/ai/flows/guide-conversation.ts';

// This file is intended for use with the `genkit:dev` and `genkit:watch` scripts.
// It is not used in the main application bundle.
// The main `ai` instance is defined in `src/ai/genkit.ts`.

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // This check is important for the Genkit dev UI.
  throw new Error('GEMINI_API_KEY is not set for Genkit development.');
}

// Define a local `ai` object for the Genkit dev environment.
// This will not be part of the production build.
export default genkit({
  plugins: [googleAI({apiKey, apiVersion: 'v1'})],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
