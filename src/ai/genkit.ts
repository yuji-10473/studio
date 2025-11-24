/**
 * @fileoverview This file exports the genkit instance.
 * It is used by the flows and actions to interact with the Genkit AI platform.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

// Always initialize the plugin. In production, the API key might be injected
// via Secret Manager and not be available as a process.env variable during build.
// Specifying v1beta is important for resolving newer model names like gemini-2.5-flash.
const googleAiPlugin = googleAI({
  apiKey: apiKey, // It's okay if apiKey is undefined here; it can be picked up from the environment later.
  apiVersion: 'v1beta',
});

export const ai = genkit({
  plugins: [googleAiPlugin],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
