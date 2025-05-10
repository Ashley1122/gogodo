import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_GENAI_API_KEY } from '@env';

if (!GOOGLE_GENAI_API_KEY) {
  console.error('GOOGLE_GENAI_API_KEY is not set in .env file');
}

// Initialize the Google AI
const genAI = new GoogleGenerativeAI(GOOGLE_GENAI_API_KEY);

// Get the model
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper function to generate text
export async function generateText(prompt: string): Promise<string> {
  try {
    if (!GOOGLE_GENAI_API_KEY) {
      throw new Error('Google AI API key is not configured. Please add GOOGLE_GENAI_API_KEY to your .env file.');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
} 