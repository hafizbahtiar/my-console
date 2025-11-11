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

export const POST = createProtectedPOST(
    async ({ body }) => {
        const { content } = body;

        // Get OpenRouter API headers
        let headers: Record<string, string>;
        try {
            headers = getOpenRouterHeaders('Blog Title Generator');
        } catch (error) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }

        // Remove HTML tags from content
        const textContent = content.replace(/<[^>]*>/g, '').trim();

        // Validate content
        if (!textContent || textContent.length < 50) {
            return NextResponse.json(
                { error: 'Content must be at least 50 characters long to generate a title' },
                { status: 400 }
            );
        }

        // Limit content to 2000 chars for prompt efficiency
        const limitedContent = textContent.length > 2000
            ? textContent.substring(0, 2000)
            : textContent;

        const prompt = `Based on the following blog post content, generate a compelling, SEO-friendly title that:
            - Is between 40-60 characters long
            - Captures the main topic and value proposition
            - Is engaging and click-worthy
            - Includes relevant keywords naturally
            - Avoids clickbait or misleading language

            Requirements:
            - No labels, prefixes, or formatting (no "Title:", "Option:", "Choice:", etc.)
            - No markdown, quotes, or special characters
            - Just the title text directly
            - Between 40-60 characters

            Content:
            ${limitedContent}

            Title:`;

        // Try models in order
        let lastError: ModelError | null = null;
        let successfulResponse: Response | null = null;
        let successfulModel = '';

        const timeoutMs = 30000; // 30 seconds

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
                        max_tokens: 100,
                        temperature: 0.7,
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
                    // Wait before trying next model
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                lastError = {
                    error: errorMessage,
                    model,
                    status: response.status,
                };
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    lastError = {
                        error: 'Request timeout',
                        model,
                    };
                    continue;
                }
                lastError = {
                    error: error.message || 'Network error',
                    model,
                };
            }
        }

        if (!successfulResponse) {
            const errorMessage = lastError?.status === 429
                ? getAllModelsRateLimitedMessage()
                : lastError?.error || 'Failed to generate title';

            return NextResponse.json(
                { error: errorMessage, retryable: true },
                { status: lastError?.status || 503 }
            );
        }

        const data: OpenRouterResponse = await successfulResponse.json();

        // Extract title from response
        let generatedTitle = '';
        if (data.choices?.[0]?.message?.content) {
            generatedTitle = data.choices[0].message.content.trim();
        } else if (data.choices?.[0]?.message?.reasoning) {
            // Try to extract from reasoning field
            const reasoning = data.choices[0].message.reasoning;
            const titleMatch = reasoning.match(/title[:\s]+["']?([^"'\n]{40,60})["']?/i);
            if (titleMatch) {
                generatedTitle = titleMatch[1].trim();
            } else {
                // Take first sentence or first 60 chars
                generatedTitle = reasoning.split(/[.!?]/)[0].trim().substring(0, 60);
            }
        }

        // Clean up title - remove formatting artifacts, prefixes, etc.
        generatedTitle = generatedTitle
            // Remove common reasoning/formatting prefixes
            .replace(/^(?:title[:\s]+|option\s*\d*:?\s*|choice\s*\d*:?\s*|alternative\s*\d*:?\s*|suggestion\s*\d*:?\s*)\s*/i, '')
            // Remove newlines and normalize whitespace
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            // Remove surrounding quotes
            .replace(/^["']|["']$/g, '')
            // Remove markdown formatting
            .replace(/\*\*|\*|__|_|`/g, '')
            // Remove any remaining leading/trailing punctuation artifacts
            .replace(/^[:\-–—]\s*/, '')
            .replace(/\s*[:\-–—]$/, '')
            .trim();

        // Validate length
        if (generatedTitle.length < 20) {
            return NextResponse.json(
                { error: 'Generated title is too short. Please try again.' },
                { status: 500 }
            );
        }

        // Limit to 60 characters (SEO best practice)
        if (generatedTitle.length > 60) {
            // Try to truncate at word boundary
            const truncated = generatedTitle.substring(0, 57);
            const lastSpace = truncated.lastIndexOf(' ');
            generatedTitle = lastSpace > 40
                ? truncated.substring(0, lastSpace) + '...'
                : truncated + '...';
        }

        return NextResponse.json(
            { title: generatedTitle },
            { status: 200 }
        );
    },
    {
        rateLimit: 'api',
        schema: z.object({
            content: z.string().min(50, 'Content must be at least 50 characters'),
        }),
    }
);

