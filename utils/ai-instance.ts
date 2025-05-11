import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXPO_PUBLIC_GOOGLE_GENAI_API_KEY } from '@env';
import * as Network from 'expo-network';

// Comprehensive logging for environment and API key
console.log('Environment Variables Check:', {
  API_KEY_PRESENT: !!EXPO_PUBLIC_GOOGLE_GENAI_API_KEY,
  API_KEY_LENGTH: EXPO_PUBLIC_GOOGLE_GENAI_API_KEY?.length,
  API_KEY_STARTS_WITH: EXPO_PUBLIC_GOOGLE_GENAI_API_KEY?.substring(0, 5)
});

// Validate Google AI API Key
export function validateGoogleAIApiKey(): boolean {
  if (!EXPO_PUBLIC_GOOGLE_GENAI_API_KEY) {
    console.error('❌ CRITICAL: GOOGLE_GENAI_API_KEY is undefined or null');
    throw new Error('Google AI API Key is missing');
  }

  const trimmedKey = EXPO_PUBLIC_GOOGLE_GENAI_API_KEY.trim();
  
  if (trimmedKey.length === 0) {
    console.error('❌ CRITICAL: GOOGLE_GENAI_API_KEY is an empty string');
    throw new Error('Google AI API Key is an empty string');
  }

  // Optional: Add a basic format check for API key
  if (trimmedKey.length < 20) {
    console.warn('⚠️ Google AI API Key seems unusually short');
  }

  return true;
}

// Enhanced network connectivity check
export async function checkNetworkConnectivity(): Promise<{
  isConnected: boolean;
  connectionType: string;
  details: any;
}> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return {
      isConnected: networkState.isConnected ?? false,
      connectionType: networkState.type ?? 'unknown',
      details: networkState
    };
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return {
      isConnected: false,
      connectionType: 'unknown',
      details: null
    };
  }
}

// Safer initialization with error handling
let googleAI: GoogleGenerativeAI | null = null;
try {
  validateGoogleAIApiKey();
  googleAI = new GoogleGenerativeAI(EXPO_PUBLIC_GOOGLE_GENAI_API_KEY);
} catch (error) {
  console.error('❌ Failed to initialize GoogleGenerativeAI:', {
    message: (error as Error).message,
    name: (error as Error).name,
    stack: (error as Error).stack
  });
}

// Ensure model initialization is also safe
export const model = googleAI?.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Comprehensive AI call with network and error diagnostics
export async function safeGenerateText(prompt: string, maxRetries = 3): Promise<string> {
  // First, check network connectivity
  const networkStatus = await checkNetworkConnectivity();
  
  if (!networkStatus.isConnected) {
    console.error('❌ No network connection', {
      connectionType: networkStatus.connectionType,
      details: networkStatus.details
    });
    return "Unable to generate response. No internet connection.";
  }

  // Retry mechanism with detailed error logging
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Validate AI initialization
      if (!googleAI || !model) {
        throw new Error('Google AI is not properly configured');
      }

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error(`AI Generation Attempt ${attempt} Failed:`, {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status,
        networkStatus: networkStatus
      });

      // Specific error type checks
      if (error.message.includes('503') || error.message.includes('unavailable')) {
        // Service temporarily unavailable
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
          continue;
        }
      }

      // Final fallback
      return "Unable to generate response. Please try again later.";
    }
  }

  return "Max retries exceeded. Service unavailable.";
}