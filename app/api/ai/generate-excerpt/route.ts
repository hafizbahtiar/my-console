import { NextRequest, NextResponse } from 'next/server';

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

interface GenerateExcerptRequest {
    title: string;
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateExcerptRequest = await request.json();
        const { title, content } = body;

        // Validate input
        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // Check if title has more than 1 word
        const titleWords = title.trim().split(/\s+/).length;
        if (titleWords <= 1) {
            return NextResponse.json(
                { error: 'Title must have more than 1 word' },
                { status: 400 }
            );
        }

        // Get OpenRouter API headers (validates API key)
        let headers: Record<string, string>;
        try {
            headers = getOpenRouterHeaders('Portfolio Blog Excerpt Generator');
        } catch (error) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }

        // Remove HTML tags from content for better AI understanding
        const textContent = content.replace(/<[^>]*>/g, '').trim();

        // Validate that content is not empty after stripping HTML
        if (!textContent || textContent.length === 0) {
            return NextResponse.json(
                { error: 'Content is empty or contains only HTML tags. Please provide text content.' },
                { status: 400 }
            );
        }

        // For long content, use more characters but still limit to prevent token limits
        // Longer content = more context but also longer processing time
        // Limit to 1500 chars for prompt to keep tokens reasonable
        const textContentLength = textContent.length;
        const limitedContent = textContentLength > 1500
            ? textContent.substring(0, 1500)
            : textContent;

        // Create concise prompt to reduce reasoning overhead for reasoning models
        // Direct instruction limits reasoning tokens and gets straight to output
        const prompt = `Write a 2-3 sentence blog excerpt (max 500 chars, no markdown/quotes) for:

Title: ${title}
Content: ${limitedContent}

Excerpt:`;

        // Use shared free models list
        const freeModels = FREE_MODELS;

        // Calculate timeout based on content length (longer content needs more time)
        const limitedContentLength = limitedContent.length;
        const timeoutMs = limitedContentLength > 1200 ? 60000 : limitedContentLength > 800 ? 45000 : 30000; // 60s for long, 45s for medium, 30s for short

        // Function to extract excerpt from reasoning field (for reasoning models)
        const extractExcerptFromReasoning = (reasoning: string): string => {
            let foundExcerpt = '';

            // Pattern 1: Look for text after "Excerpt:" marker
            const excerptMarkerIndex = reasoning.toLowerCase().lastIndexOf('excerpt:');
            if (excerptMarkerIndex !== -1) {
                const afterMarker = reasoning.substring(excerptMarkerIndex + 8).trim();
                // Extract first 2-3 complete sentences after marker
                const sentencesAfterMarker = afterMarker.split(/[.!?]+/)
                    .filter((s: string) => s.trim().length > 20)
                    .slice(0, 3)
                    .join('. ')
                    .trim();

                if (sentencesAfterMarker.length > 50 && sentencesAfterMarker.length <= 500) {
                    foundExcerpt = sentencesAfterMarker;
                }
            }

            // Pattern 2: Look for quoted text (often the actual output)
            if (!foundExcerpt) {
                const quotedMatches = reasoning.match(/(?:"|')([^"']{50,500})(?:"|')/g);
                if (quotedMatches && quotedMatches.length > 0) {
                    // Take the last quoted text (most likely the output)
                    const lastQuote = quotedMatches[quotedMatches.length - 1];
                    foundExcerpt = lastQuote.replace(/^["']|["']$/g, '').trim();
                }
            }

            // Pattern 3: Extract last meaningful sentences, filtering out thinking patterns
            if (!foundExcerpt || foundExcerpt.length < 50) {
                const sentences = reasoning.split(/[.!?]+/).filter((s: string) => s.trim().length > 30);
                if (sentences.length > 0) {
                    // Filter out thinking/analysis patterns and take last 2-3 sentences
                    const candidateSentences = sentences
                        .filter((s: string) => {
                            const lower = s.toLowerCase();
                            return !lower.includes('wait -') &&
                                !lower.includes('let me') &&
                                !lower.includes('hmm') &&
                                !lower.includes('brainstorming') &&
                                !lower.includes('potential pitfalls') &&
                                !lower.includes('refining:') &&
                                !lower.includes('first,') &&
                                !lower.includes('looking at') &&
                                !lower.includes('i notice') &&
                                !lower.includes('should') &&
                                !lower.includes('must');
                        })
                        .slice(-3); // Take last 3 sentences

                    if (candidateSentences.length >= 2) {
                        foundExcerpt = candidateSentences.slice(-2).join('. ').trim();
                    } else if (candidateSentences.length === 1 && candidateSentences[0].length > 50) {
                        foundExcerpt = candidateSentences[0].trim();
                    } else {
                        // Fallback: last 2 sentences even if they have thinking patterns
                        foundExcerpt = sentences.slice(-2).join('. ').trim();
                    }
                }
            }

            // Last resort: take last 500 chars if nothing else works
            if (!foundExcerpt || foundExcerpt.length < 50) {
                foundExcerpt = reasoning.substring(Math.max(0, reasoning.length - 500)).trim();
            }

            // Clean up the excerpt
            foundExcerpt = foundExcerpt
                .replace(/^(?:first sentence|second sentence|third|excerpt:)\s*/i, '')
                .replace(/^\*+/g, '')
                .replace(/\*+$/g, '')
                .trim();

            return foundExcerpt;
        };

        // Function to call OpenRouter API with a specific model and retry logic
        const callOpenRouter = async (model: string, retryCount = 0): Promise<{ response: Response; model: string; errorData?: OpenRouterErrorData }> => {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
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
                        max_tokens: 600, // Increased significantly for reasoning models (they use tokens for thinking)
                        temperature: 0.7,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                // Read response body once (can only be consumed once)
                let errorData: OpenRouterErrorData | undefined = undefined;
                if (!response.ok) {
                    const responseText = await response.text();
                    try {
                        errorData = JSON.parse(responseText) as OpenRouterErrorData;
                    } catch {
                        errorData = { raw: responseText };
                    }
                }

                // If rate limited (429) and haven't exceeded retries, retry with exponential backoff
                if (response.status === 429 && retryCount < 3) {
                    // Increased retry wait times: 3s, 6s, 12s (was 2s, 4s)
                    const waitTime = Math.pow(2, retryCount) * 3000;
                    console.log(`Rate limited on ${model}. Retrying in ${waitTime}ms... (attempt ${retryCount + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return callOpenRouter(model, retryCount + 1);
                }

                return { response, model, errorData };

            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                // Handle timeout errors
                if (fetchError.name === 'AbortError') {
                    return {
                        response: new Response(JSON.stringify({
                            error: { message: `Request timeout after ${timeoutMs}ms. Content might be too long.` }
                        }), { status: 408 }),
                        model,
                        errorData: { error: { message: 'Request timeout', code: '408' } }
                    };
                }

                // Re-throw other errors
                throw fetchError;
            }
        };

        // Try models in order until one works
        let lastError: ModelError | null = null;
        let successfulResponse: Response | null = null;
        let successfulModel = '';

        for (const model of freeModels) {
            try {
                console.log(`Attempting to generate excerpt with model: ${model}`);
                const { response, errorData } = await callOpenRouter(model);

                // If successful (200-299), use this response
                if (response.ok) {
                    successfulResponse = response;
                    successfulModel = model;
                    console.log(`Successfully generated excerpt with model: ${model}`);
                    break;
                }

                // Get user-friendly error message
                const errorMessage = getErrorMessage(response.status, errorData);

                // Handle rate limiting - try next model
                if (response.status === 429) {
                    lastError = {
                        error: errorMessage,
                        model,
                        status: 429
                    };
                    console.warn(`Model ${model} is rate-limited. Trying next model...`);
                    continue;
                }

                // For non-retryable errors (400, 401, 402, 403), don't try other models
                if (isNonRetryableError(response.status)) {
                    return NextResponse.json(
                        { error: errorMessage },
                        { status: response.status }
                    );
                }

                // For other errors, try next model
                lastError = {
                    error: errorMessage,
                    model,
                    status: response.status
                };
                console.warn(`Model ${model} returned error ${response.status}. Trying next model...`);
                continue;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Network error';
                console.error(`Error with model ${model}:`, error);
                lastError = { error: errorMessage, model };
                continue;
            }
        }

        // If all models failed, return error
        if (!successfulResponse || !successfulResponse.ok) {
            let errorMessage = 'Failed to generate excerpt';

            if (lastError?.status === 429) {
                errorMessage = getAllModelsRateLimitedMessage();
            } else if (lastError?.error) {
                errorMessage = lastError.error;
            } else {
                errorMessage = 'All AI models are currently unavailable. Please try again later.';
            }

            return NextResponse.json(
                { error: errorMessage, retryable: true },
                { status: lastError?.status || 503 }
            );
        }

        const response = successfulResponse;

        const data = await response.json() as OpenRouterResponse;

        // Log the response structure for debugging
        console.log(`OpenRouter response from model ${successfulModel}:`, JSON.stringify(data, null, 2));

        // According to OpenRouter API docs: response structure is
        // { id, choices: [{ finish_reason, message: { role, content } }], usage, model }
        let generatedExcerpt = '';
        let finishReason: string | null = null;

        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            finishReason = choice.finish_reason || null;

            // Handle error in choice (per docs, choices can have an error field)
            if (choice.error) {
                console.error('OpenRouter choice error:', choice.error);
                return NextResponse.json(
                    {
                        error: choice.error.message || 'Error in AI response',
                        code: choice.error.code
                    },
                    { status: 500 }
                );
            }

            // Extract content from message (content can be string | null per docs)
            // Some reasoning models (like DeepSeek R1, Qwen R1) return content in 'reasoning' field
            if (choice.message) {
                // First try standard content field
                if (choice.message.content && typeof choice.message.content === 'string' && choice.message.content.trim()) {
                    generatedExcerpt = choice.message.content.trim();
                }
                // If content is empty but has reasoning (reasoning models)
                else if (choice.message.reasoning && typeof choice.message.reasoning === 'string') {
                    const reasoning = choice.message.reasoning.trim();
                    const foundExcerpt = extractExcerptFromReasoning(reasoning);

                    if (foundExcerpt.length > 0 && foundExcerpt.length <= 500) {
                        generatedExcerpt = foundExcerpt;
                    } else if (foundExcerpt.length > 500) {
                        // Truncate to last complete sentence within 500 chars
                        const truncated = foundExcerpt.substring(0, 497);
                        const lastSentenceEnd = Math.max(
                            truncated.lastIndexOf('.'),
                            truncated.lastIndexOf('!'),
                            truncated.lastIndexOf('?')
                        );
                        generatedExcerpt = lastSentenceEnd > 100
                            ? truncated.substring(0, lastSentenceEnd + 1).trim()
                            : truncated.trim();
                    }
                }
                // Check reasoning_details array
                else if (choice.message.reasoning_details && Array.isArray(choice.message.reasoning_details)) {
                    const reasoningTexts = choice.message.reasoning_details
                        .filter((item) => item.type === 'reasoning.text' && item.text)
                        .map((item) => item.text!.trim())
                        .join(' ')
                        .trim();

                    if (reasoningTexts) {
                        // Extract meaningful excerpt from reasoning
                        const sentences = reasoningTexts.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
                        if (sentences.length > 0) {
                            generatedExcerpt = sentences.slice(-2).join('. ').trim();
                        } else {
                            generatedExcerpt = reasoningTexts.substring(0, 500).trim();
                        }
                    }
                }
            }
        }

        // Check finish_reason for issues
        if (finishReason === 'length') {
            console.warn('Generation stopped due to max_tokens limit');
            // Still try to use the content/reasoning even if truncated
            // For reasoning models, we already extracted from reasoning field above
        } else if (finishReason === 'content_filter') {
            return NextResponse.json(
                {
                    error: 'Content was filtered by the AI model',
                    details: 'Please try adjusting your title or content.'
                },
                { status: 400 }
            );
        } else if (finishReason === 'error') {
            return NextResponse.json(
                {
                    error: 'AI model encountered an error',
                    details: 'Please try again later.'
                },
                { status: 500 }
            );
        }

        if (!generatedExcerpt || generatedExcerpt.trim().length === 0) {
            console.error('No excerpt generated. Response structure:', {
                hasChoices: !!data.choices,
                choicesLength: data.choices?.length,
                finishReason,
                model: successfulModel,
                fullResponse: data
            });

            return NextResponse.json(
                {
                    error: 'No excerpt generated. The AI model did not return any content.',
                    details: finishReason ? `Finish reason: ${finishReason}` : 'Please try again or check the OpenRouter API status.'
                },
                { status: 500 }
            );
        }

        // Clean up the excerpt
        // Remove any markdown formatting, quotes, etc.
        let cleanedExcerpt = generatedExcerpt
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/\*\*|\*|__|_|`/g, '') // Remove markdown formatting
            .trim();

        // Validate minimum length (at least 50 characters)
        if (cleanedExcerpt.length < 50) {
            console.warn(`Generated excerpt is too short (${cleanedExcerpt.length} chars). Minimum: 50 chars.`);
            return NextResponse.json(
                {
                    error: 'Generated excerpt is too short. Please try again or provide more content.',
                    details: `Generated excerpt was only ${cleanedExcerpt.length} characters. Minimum required: 50 characters.`
                },
                { status: 500 }
            );
        }

        // Limit to 500 characters
        if (cleanedExcerpt.length > 500) {
            cleanedExcerpt = cleanedExcerpt.substring(0, 497) + '...';
        }

        return NextResponse.json(
            { excerpt: cleanedExcerpt },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error generating excerpt:', error);
        return NextResponse.json(
            { error: 'Failed to generate excerpt. Please try again.' },
            { status: 500 }
        );
    }
}
