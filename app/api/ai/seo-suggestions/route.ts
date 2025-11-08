import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createProtectedPOST } from '@/lib/api-protection';
import {
    OpenRouterErrorData,
    OpenRouterResponse,
    ModelError,
    FREE_MODELS,
    OPENROUTER_API_URL,
    getOpenRouterHeaders,
    getErrorMessage,
    isNonRetryableError,
    getAllModelsRateLimitedMessage,
} from '@/lib/openrouter';

export interface SEOSuggestions {
    title: {
        current: string;
        suggested: string;
        score: number;
        feedback: string[];
    };
    description: {
        current?: string;
        suggested: string;
        score: number;
        feedback: string[];
    };
    keywords: {
        suggested: string[];
        score: number;
        feedback: string[];
    };
    overall: {
        score: number;
        feedback: string[];
    };
}

export const POST = createProtectedPOST(
    async ({ body }) => {
        const { title, content, description, keywords } = body;

        // Get OpenRouter API headers
        let headers: Record<string, string>;
        try {
            headers = getOpenRouterHeaders('SEO Optimization Assistant');
        } catch (error) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }

        // Remove HTML tags from content
        const textContent = content.replace(/<[^>]*>/g, '').trim();

        if (!textContent || textContent.length < 50) {
            return NextResponse.json(
                { error: 'Content must be at least 50 characters long' },
                { status: 400 }
            );
        }

        // Limit content for prompt
        const limitedContent = textContent.length > 2000
            ? textContent.substring(0, 2000)
            : textContent;

        const prompt = `Analyze the following blog post and provide SEO optimization suggestions in JSON format:

Title: ${title || 'Not provided'}
Description: ${description || 'Not provided'}
Keywords: ${keywords?.join(', ') || 'Not provided'}
Content: ${limitedContent.substring(0, 1000)}...

Provide a JSON response with this structure:
{
  "title": {
    "current": "${title || ''}",
    "suggested": "optimized title (40-60 chars)",
    "score": 0-100,
    "feedback": ["issue 1", "issue 2"]
  },
  "description": {
    "current": "${description || ''}",
    "suggested": "optimized meta description (150-160 chars)",
    "score": 0-100,
    "feedback": ["issue 1", "issue 2"]
  },
  "keywords": {
    "suggested": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "score": 0-100,
    "feedback": ["issue 1", "issue 2"]
  },
  "overall": {
    "score": 0-100,
    "feedback": ["general feedback 1", "general feedback 2"]
  }
}

Only return the JSON, no other text.`;

        // Try models
        let lastError: ModelError | null = null;
        let successfulResponse: Response | null = null;
        let successfulModel = '';

        const timeoutMs = 45000; // 45 seconds

        for (const model of FREE_MODELS) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model,
                        messages: [
                            {
                                role: 'user',
                                content: prompt,
                            },
                        ],
                        max_tokens: 800,
                        temperature: 0.5,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    successfulResponse = response;
                    successfulModel = model;
                    break;
                }

                const errorData: OpenRouterErrorData = await response.json().catch(() => ({}));
                const errorMessage = getErrorMessage(response.status, errorData);

                if (isNonRetryableError(response.status)) {
                    return NextResponse.json(
                        { error: errorMessage },
                        { status: response.status }
                    );
                }

                if (response.status === 429 && model !== FREE_MODELS[FREE_MODELS.length - 1]) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                lastError = {
                    error: errorMessage,
                    model,
                    status: response.status,
                };
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    lastError = { error: 'Request timeout', model };
                    continue;
                }
                lastError = { error: error.message || 'Network error', model };
            }
        }

        if (!successfulResponse) {
            const errorMessage = lastError?.status === 429
                ? getAllModelsRateLimitedMessage()
                : lastError?.error || 'Failed to generate SEO suggestions';
            
            return NextResponse.json(
                { error: errorMessage, retryable: true },
                { status: lastError?.status || 503 }
            );
        }

        const data: OpenRouterResponse = await successfulResponse.json();

        // Extract JSON from response
        let suggestionsText = '';
        if (data.choices?.[0]?.message?.content) {
            suggestionsText = data.choices[0].message.content.trim();
        } else if (data.choices?.[0]?.message?.reasoning) {
            suggestionsText = data.choices[0].message.reasoning.trim();
        }

        // Extract JSON from text (handle markdown code blocks)
        let jsonText = suggestionsText;
        const jsonMatch = suggestionsText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        } else {
            // Try to find JSON object
            const braceMatch = suggestionsText.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                jsonText = braceMatch[0];
            }
        }

        try {
            const suggestions: SEOSuggestions = JSON.parse(jsonText);
            
            // Validate and clean suggestions
            if (!suggestions.title) {
                throw new Error('Invalid response format: missing title');
            }
            if (!suggestions.description) {
                throw new Error('Invalid response format: missing description');
            }
            if (!suggestions.keywords) {
                throw new Error('Invalid response format: missing keywords');
            }

            // Ensure scores are valid
            suggestions.title.score = Math.max(0, Math.min(100, suggestions.title.score || 0));
            suggestions.description.score = Math.max(0, Math.min(100, suggestions.description.score || 0));
            suggestions.keywords.score = Math.max(0, Math.min(100, suggestions.keywords.score || 0));
            suggestions.overall = suggestions.overall || {
                score: Math.round((suggestions.title.score + suggestions.description.score + suggestions.keywords.score) / 3),
                feedback: [],
            };

            return NextResponse.json(
                { suggestions },
                { status: 200 }
            );
        } catch (parseError) {
            console.error('Failed to parse SEO suggestions:', parseError);
            console.error('Response text:', suggestionsText);
            
            return NextResponse.json(
                { error: 'Failed to parse SEO suggestions. Please try again.' },
                { status: 500 }
            );
        }
    },
    {
        rateLimit: 'api',
        schema: z.object({
            title: z.string().min(1, 'Title is required'),
            content: z.string().min(50, 'Content must be at least 50 characters'),
            description: z.string().optional(),
            keywords: z.array(z.string()).optional(),
        }),
    }
);

