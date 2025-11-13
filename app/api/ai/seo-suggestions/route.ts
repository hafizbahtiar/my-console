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

        // Extract JSON from text (handle markdown code blocks and reasoning text)
        let jsonText = suggestionsText;
        
        // First, try to find JSON in markdown code blocks
        const jsonMatch = suggestionsText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        } else {
            // Try to find JSON object - look for the last complete JSON object
            // This handles cases where AI returns reasoning text before/after JSON
            const jsonObjects = [];
            let braceCount = 0;
            let startIndex = -1;
            
            for (let i = 0; i < suggestionsText.length; i++) {
                if (suggestionsText[i] === '{') {
                    if (braceCount === 0) {
                        startIndex = i;
                    }
                    braceCount++;
                } else if (suggestionsText[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && startIndex !== -1) {
                        // Found a complete JSON object
                        jsonObjects.push({
                            start: startIndex,
                            end: i + 1,
                            text: suggestionsText.substring(startIndex, i + 1)
                        });
                        startIndex = -1;
                    }
                }
            }
            
            // Use the largest JSON object found (most likely the main response)
            if (jsonObjects.length > 0) {
                const largestObject = jsonObjects.reduce((prev, current) => 
                    current.text.length > prev.text.length ? current : prev
                );
                jsonText = largestObject.text;
            } else {
                // Fallback: get everything from first { to end (even if incomplete)
                const firstBrace = suggestionsText.indexOf('{');
                if (firstBrace !== -1) {
                    jsonText = suggestionsText.substring(firstBrace);
                }
            }
        }

        // Try to repair incomplete JSON
        const repairJSON = (text: string): string => {
            let repaired = text.trim();
            
            // Handle incomplete values (colon but no value after)
            repaired = repaired.replace(/:\s*$/gm, ': null');
            repaired = repaired.replace(/:\s*([,\n}])/g, ': null$1');
            
            // Handle incomplete strings (opening quote but no closing)
            const incompleteStringMatch = repaired.match(/:\s*"([^"]*?)([,\n}])/);
            if (incompleteStringMatch && !incompleteStringMatch[1].endsWith('"')) {
                // Find all incomplete strings and close them
                repaired = repaired.replace(/:\s*"([^"]*?)(?=[,\n}])/g, (match, content) => {
                    // If content doesn't end with quote and we're at end of line/object, close it
                    if (!content.endsWith('"')) {
                        return `: "${content}"`;
                    }
                    return match;
                });
            }
            
            // Handle incomplete arrays
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            if (openBrackets > closeBrackets) {
                // Find last incomplete array and close it
                let lastOpenBracket = repaired.lastIndexOf('[');
                let lastCloseBracket = repaired.lastIndexOf(']');
                if (lastOpenBracket > lastCloseBracket) {
                    // Check if there's content after the last [
                    const afterBracket = repaired.substring(lastOpenBracket + 1).trim();
                    if (afterBracket && !afterBracket.startsWith(']')) {
                        // Add closing bracket before the next } or at end
                        const nextBrace = repaired.indexOf('}', lastOpenBracket);
                        if (nextBrace > lastOpenBracket) {
                            repaired = repaired.substring(0, nextBrace) + ']' + repaired.substring(nextBrace);
                        } else {
                            repaired += ']';
                        }
                    }
                }
            }
            
            // Count braces to see if object is closed
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            
            // Close incomplete object
            if (openBraces > closeBraces) {
                // Find last incomplete string/array/object
                let lastQuote = repaired.lastIndexOf('"');
                let lastBracket = repaired.lastIndexOf(']');
                let lastBrace = repaired.lastIndexOf('}');
                let lastColon = repaired.lastIndexOf(':');
                
                // If we have a colon at the end with no value, add null
                if (lastColon > Math.max(lastQuote, lastBracket, lastBrace)) {
                    const afterColon = repaired.substring(lastColon + 1).trim();
                    if (!afterColon || afterColon === '' || afterColon.startsWith(',')) {
                        repaired = repaired.substring(0, lastColon + 1) + ' null';
                    }
                }
                
                // If we're in the middle of a string, close it
                if (lastQuote > lastBracket && lastQuote > lastBrace) {
                    // Check if quote is escaped
                    let quotePos = lastQuote;
                    let escaped = false;
                    while (quotePos > 0 && repaired[quotePos - 1] === '\\') {
                        escaped = !escaped;
                        quotePos--;
                    }
                    if (!escaped && !repaired.substring(lastQuote + 1).trim().startsWith('"')) {
                        // String is incomplete, close it
                        repaired += '"';
                    }
                }
                
                // Close all remaining objects
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    repaired += '}';
                }
            }
            
            return repaired;
        };

        try {
            // Try parsing original JSON first
            let suggestions: SEOSuggestions;
            try {
                suggestions = JSON.parse(jsonText);
            } catch (firstError) {
                // If parsing fails, try to repair and parse again
                const repairedJson = repairJSON(jsonText);
                try {
                    suggestions = JSON.parse(repairedJson);
                } catch (secondError) {
                    // If still fails, try to extract partial data
                    console.warn('Failed to parse JSON even after repair, attempting partial extraction');
                    
                    // Try to extract at least title and description using more flexible regex
                    const titleMatch = jsonText.match(/"title"\s*:\s*\{[^}]*?"suggested"\s*:\s*"([^"]*?)"/);
                    const descMatch = jsonText.match(/"description"\s*:\s*\{[^}]*?"suggested"\s*:\s*"([^"]*?)"/);
                    const keywordsMatch = jsonText.match(/"keywords"\s*:\s*\{[^}]*?"suggested"\s*:\s*\[([^\]]*?)\]/);
                    
                    // Extract keywords if available
                    let keywords: string[] = [];
                    if (keywordsMatch && keywordsMatch[1]) {
                        // Extract quoted strings from keywords array
                        const keywordMatches = keywordsMatch[1].match(/"([^"]+)"/g);
                        if (keywordMatches) {
                            keywords = keywordMatches.map(k => k.replace(/"/g, ''));
                        }
                    }
                    
                    if (titleMatch || descMatch || keywords.length > 0) {
                        // Create minimal valid response with whatever we can extract
                        suggestions = {
                            title: {
                                current: titleMatch?.[1] || body.title || '',
                                suggested: titleMatch?.[1] || body.title || '',
                                score: 50,
                                feedback: ['Partial extraction from AI response']
                            },
                            description: {
                                current: body.description || '',
                                suggested: descMatch?.[1] || body.description || '',
                                score: 50,
                                feedback: ['Partial extraction from AI response']
                            },
                            keywords: {
                                suggested: keywords.length > 0 ? keywords : (body.keywords || []),
                                score: 50,
                                feedback: ['Partial extraction from AI response']
                            },
                            overall: {
                                score: 50,
                                feedback: ['AI response was partially parsed']
                            }
                        };
                    } else {
                        // If we can't extract anything, create a default response
                        console.warn('Could not extract any SEO suggestions from AI response, using defaults');
                        suggestions = {
                            title: {
                                current: body.title || '',
                                suggested: body.title || '',
                                score: 50,
                                feedback: ['Unable to analyze title - AI response format was invalid']
                            },
                            description: {
                                current: body.description || '',
                                suggested: body.description || '',
                                score: 50,
                                feedback: ['Unable to analyze description - AI response format was invalid']
                            },
                            keywords: {
                                suggested: body.keywords || [],
                                score: 50,
                                feedback: ['Unable to analyze keywords - AI response format was invalid']
                            },
                            overall: {
                                score: 50,
                                feedback: ['AI response could not be parsed. Please try again or check your content.']
                            }
                        };
                    }
                }
            }
            
            // Validate and clean suggestions - make fields optional and provide defaults
            // Don't throw errors, just provide sensible defaults
            if (!suggestions.title) {
                suggestions.title = {
                    current: body.title || '',
                    suggested: body.title || '',
                    score: 50,
                    feedback: ['Title analysis not available']
                };
            } else {
                // Ensure title has required fields
                if (!suggestions.title.current) suggestions.title.current = body.title || '';
                if (!suggestions.title.suggested) suggestions.title.suggested = body.title || '';
                if (typeof suggestions.title.score !== 'number') suggestions.title.score = 50;
                if (!Array.isArray(suggestions.title.feedback)) suggestions.title.feedback = [];
            }
            
            if (!suggestions.description) {
                suggestions.description = {
                    current: body.description || '',
                    suggested: body.description || '',
                    score: 50,
                    feedback: ['Description analysis not available']
                };
            } else {
                // Ensure description has required fields
                if (suggestions.description.current === undefined) suggestions.description.current = body.description || '';
                if (!suggestions.description.suggested) suggestions.description.suggested = body.description || '';
                if (typeof suggestions.description.score !== 'number') suggestions.description.score = 50;
                if (!Array.isArray(suggestions.description.feedback)) suggestions.description.feedback = [];
            }
            
            if (!suggestions.keywords) {
                suggestions.keywords = {
                    suggested: body.keywords || [],
                    score: 50,
                    feedback: ['Keywords analysis not available']
                };
            } else {
                // Ensure keywords has required fields
                if (!Array.isArray(suggestions.keywords.suggested)) suggestions.keywords.suggested = body.keywords || [];
                if (typeof suggestions.keywords.score !== 'number') suggestions.keywords.score = 50;
                if (!Array.isArray(suggestions.keywords.feedback)) suggestions.keywords.feedback = [];
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
        } catch (parseError: any) {
            console.error('Failed to parse SEO suggestions:', parseError);
            console.error('Parse error message:', parseError?.message);
            console.error('Response text:', suggestionsText);
            console.error('Extracted JSON text:', jsonText);
            
            // Try to repair and log
            try {
                const repaired = repairJSON(jsonText);
                console.error('Repaired JSON text:', repaired);
            } catch (repairError) {
                console.error('Failed to repair JSON:', repairError);
            }
            
            // Return more detailed error in development
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? `Failed to parse SEO suggestions: ${parseError?.message || 'Unknown error'}. Response length: ${suggestionsText.length}`
                : 'Failed to parse SEO suggestions. Please try again.';
            
            return NextResponse.json(
                { error: errorMessage },
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

