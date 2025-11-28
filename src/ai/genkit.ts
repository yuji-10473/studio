
/**
 * @fileoverview This file exports the genkit instance.
 * It is used by the flows and actions to interact with the Genkit AI platform.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

// Ensure the API key is available in the environment.
/*
// This check can cause the server to fail on startup if the secret is not yet available.
if (!apiKey) {
  // This will cause the server to fail to start if the key is not present,
  // making it clear that the environment variable is missing.
  throw new Error('The GEMINI_API_KEY environment variable is not set.');
}
*/

// In a deployed environment (like App Hosting), the API key might be provided
// via Secret Manager and not available as a process.env variable during build or even runtime startup.
// The Google AI plugin can automatically use Application Default Credentials if an API key is not explicitly provided.
const googleAiPlugin = apiKey
  ? googleAI({ apiKey, apiVersion: 'v1' })
  : googleAI({ apiVersion: 'v1' });

export const ai = genkit({
  plugins: [googleAiPlugin],
});
