import {genkit, type GenkitErrorCode, type GenkitError} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

import '@/ai/flows/generate-character-persona.ts';
import '@/ai/flows/dynamic-character-introduction.ts';
import '@/ai/flows/generate-new-character.ts';
import '@/ai/flows/guide-conversation.ts';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}

export const ai = genkit({
  plugins: [googleAI({apiKey, apiVersion: 'v1beta'})],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
