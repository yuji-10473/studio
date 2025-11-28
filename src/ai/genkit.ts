
/**
 * @fileoverview This file exports the genkit instance.
 * It is used by the flows and actions to interact with the Genkit AI platform.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

// Ensure the API key is available in the environment.
/*
// TEMPORARILY COMMENTED OUT FOR DEBUGGING
// This check can cause the server to fail on startup if the secret is not yet available.
if (!apiKey) {
  // This will cause the server to fail to start if the key is not present,
  // making it clear that the environment variable is missing.
  throw new Error('The GEMINI_API_KEY environment variable is not set.');
}
*/

// Always initialize the plugin. In production, the API key might be injected
// via Secret Manager and not be available as a process.env variable during build.
const googleAiPlugin = googleAI({
  // Use the apiKey from environment, but allow it to be undefined for now.
  apiKey: apiKey || '',
  apiVersion: 'v1',
});

export const ai = genkit({
  plugins: [googleAiPlugin],
});
