
/**
 * @fileoverview This file exports the genkit instance.
 * It is used by the flows and actions to interact with the Genkit AI platform.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

// In a deployed environment (like App Hosting), the API key might be provided
// via Secret Manager and not available as a process.env variable during build or even runtime startup.
// The Google AI plugin can automatically use Application Default Credentials if an API key is not explicitly provided.
const googleAiPlugin = apiKey
  ? googleAI({ apiKey, apiVersion: 'v1' })
  : googleAI({ apiVersion: 'v1' });

export const ai = genkit({
  plugins: [googleAiPlugin],
});
