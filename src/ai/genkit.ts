/**
 * @fileoverview This file exports the genkit instance.
 * It is used by the flows and actions to interact with the Genkit AI platform.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;
const plugins = [];
if (apiKey) {
  plugins.push(googleAI({apiKey, apiVersion: 'v1beta'}));
}

export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
