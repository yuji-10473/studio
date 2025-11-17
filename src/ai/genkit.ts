import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1'})],
  model: googleAI.model('gemini-2.5-flash'),
});
