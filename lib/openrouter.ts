/**
 * Shared types and constants for OpenRouter API integration
 */

// Type definitions for OpenRouter API
export interface OpenRouterError {
  message?: string;
  code?: string;
  metadata?: {
    raw?: string;
  };
}

export interface OpenRouterErrorData {
  error?: OpenRouterError;
  raw?: string;
}

export interface OpenRouterChoice {
  finish_reason?: string;
  message?: {
    role?: string;
    content?: string | null;
    reasoning?: string;
    reasoning_details?: Array<{
      type?: string;
      text?: string;
    }>;
  };
  error?: {
    message?: string;
    code?: string;
  };
}

export interface OpenRouterResponse {
  id?: string;
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

export interface ModelError {
  error: string;
  model?: string;
  status?: number;
}

/**
 * List of free OpenRouter models to use as fallbacks
 * Ordered by reliability and availability
 */
export const FREE_MODELS = [
  // Qwen models (prioritized for reliability)
  'qwen/qwen3-235b-a22b:free',
  'qwen/qwen3-14b:free',
  'qwen/qwen3-coder:free',
  'qwen/qwen-2-7b-instruct:free',
  // DeepSeek models (good performance and availability)
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1-0528:free',
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-chat-v3.1:free',
  'deepseek/deepseek-chat-v3-0324:free',
  // Google models
  'google/gemini-flash-1.5-8b:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3n-e4b-it:free',
  // Other providers
  'meta-llama/llama-3.2-3b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'z-ai/glm-4.5-air:free',
  'minimax/minimax-m2:free',
] as const;

/**
 * OpenRouter API endpoint
 */
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Get OpenRouter API headers
 */
export function getOpenRouterHeaders(appTitle: string): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://console.hafizbahtiar.com',
    'X-Title': appTitle,
  };
}

/**
 * Get user-friendly error message from OpenRouter error
 */
export function getErrorMessage(responseStatus: number, errorData?: OpenRouterErrorData): string {
  let errorMessage = 'Unknown error';

  if (errorData?.error) {
    if (errorData.error.message) {
      errorMessage = errorData.error.message;
    }
    if (errorData.error.metadata?.raw) {
      errorMessage = errorData.error.metadata.raw;
    }
  } else if (errorData?.raw) {
    errorMessage = errorData.raw;
  } else {
    errorMessage = `Error ${responseStatus}`;
  }

  // Map error codes to user-friendly messages
  switch (responseStatus) {
    case 400:
      return `Invalid request: ${errorMessage}`;
    case 401:
      return 'Invalid API key. Please check your OpenRouter API key.';
    case 402:
      return 'Insufficient credits. Please add credits to your OpenRouter account.';
    case 403:
      return `Content filtered: ${errorMessage}`;
    case 408:
      return 'Request timeout. The model took too long to respond.';
    case 429:
      return errorMessage || 'Rate limited';
    case 502:
      return 'Bad gateway. The upstream provider is experiencing issues.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return errorMessage;
  }
}

/**
 * Check if an error status is non-retryable (should not try other models)
 */
export function isNonRetryableError(status: number): boolean {
  return [400, 401, 402, 403].includes(status);
}

/**
 * Get rate limit error message for when all models fail
 */
export function getAllModelsRateLimitedMessage(): string {
  return 'All free AI models are temporarily rate-limited upstream. Please try again in a few moments.';
}

