import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST } from '@/lib/api-protection';
import { apiSchemas } from '@/lib/api-schemas';
import {
  OpenRouterErrorData, OpenRouterResponse, ModelError, FREE_MODELS,
  OPENROUTER_API_URL, getOpenRouterHeaders, getErrorMessage,
  isNonRetryableError, getAllModelsRateLimitedMessage,
} from '@/lib/openrouter';

export const POST = createProtectedPOST(
  async ({ body }) => {
    const { content, action, title } = body;

    // Strip HTML tags for processing
    const plainTextContent = content.replace(/<[^>]*>/g, '').trim();

    // Prepare the improvement prompt based on action
    const prompt = createImprovementPrompt(action, plainTextContent, title);

    // Try different AI models in order of preference
    let lastError: ModelError | null = null;

    for (const model of FREE_MODELS) {
      try {
        const timeoutMs = Math.min(60000, 10000 + plainTextContent.length * 2); // Dynamic timeout based on content length

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: getOpenRouterHeaders('My Console Blog Content Improver'),
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: Math.min(4000, Math.max(1000, plainTextContent.length * 1.5)),
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const errorData: OpenRouterErrorData = await response.json();
          const errorMessage = getErrorMessage(response.status, errorData);

          if (isNonRetryableError(response.status)) {
            return NextResponse.json(
              { error: errorMessage },
              { status: response.status }
            );
          }

          lastError = {
            error: errorMessage,
            model,
            status: response.status
          };
          continue; // Try next model
        }

        const data: OpenRouterResponse = await response.json();

        if (!data.choices?.[0]?.message?.content) {
          throw new Error('No content received from AI model');
        }

        let improvedContent = data.choices[0].message.content.trim();

        // Post-process the response based on action
        improvedContent = postProcessContent(improvedContent, action);

        // Validate the response
        if (improvedContent.length < 10) {
          throw new Error('AI response too short');
        }

        return NextResponse.json({
          improvedContent,
          model: model,
          action
        }, { status: 200 });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = {
          error: errorMessage,
          model
        };

        // If it's a timeout or network error, or the last model, don't continue
        if (model === FREE_MODELS[FREE_MODELS.length - 1]) {
          break;
        }

        // Wait a bit before trying the next model
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }

    // If we get here, all models failed
    const errorMessage = lastError?.error || getAllModelsRateLimitedMessage();

    return NextResponse.json(
      { error: `Failed to improve content: ${errorMessage}` },
      { status: 500 }
    );
  },
  {
    rateLimit: 'api',
    schema: apiSchemas.ai.improveContent,
  }
);

function createImprovementPrompt(action: string, content: string, title?: string): string {
  const context = title ? `Title: "${title}"\n\n` : '';

  switch (action) {
    case 'improve':
      return `${context}Please improve the following blog post content by:
- Making it more engaging and readable
- Improving the flow and structure
- Enhancing clarity and conciseness
- Adding better transitions between ideas
- Maintaining the original meaning and key points

Content to improve:
${content}

Please provide only the improved content without any additional explanations or formatting.`;

    case 'rephrase':
      return `${context}Please rephrase the following blog post content while:
- Keeping the same meaning and key points
- Using different words and sentence structures
- Making it more natural and flowing
- Maintaining a professional tone
- Preserving all important information

Content to rephrase:
${content}

Please provide only the rephrased content without any additional explanations.`;

    case 'shorten':
      return `${context}Please shorten the following blog post content by:
- Reducing word count by 30-50%
- Keeping all essential information and key points
- Maintaining clarity and coherence
- Preserving the main message and conclusions

Content to shorten:
${content}

Please provide only the shortened content without any additional explanations.`;

    case 'expand':
      return `${context}Please expand the following blog post content by:
- Adding more details and explanations where appropriate
- Providing examples or elaborations
- Improving transitions between ideas
- Making the content more comprehensive
- Adding relevant context when helpful

Content to expand:
${content}

Please provide only the expanded content without any additional explanations.`;

    case 'grammar':
      return `${context}Please fix grammar, spelling, and punctuation in the following blog post content:
- Correct any grammatical errors
- Fix spelling mistakes
- Improve punctuation
- Make sentences clearer
- Ensure consistent tense and style

Content to fix:
${content}

Please provide only the corrected content without any additional explanations.`;

    default:
      return `${context}Please improve the following blog post content by making it more engaging, clear, and well-structured:

Content:
${content}

Please provide only the improved content without any additional explanations.`;
  }
}

function postProcessContent(content: string, action: string): string {
  // Remove common AI prefixes/suffixes
  content = content.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
  content = content.replace(/^Here is the (improved|rephrased|shortened|expanded|corrected) (content|version):?\s*/i, '');
  content = content.replace(/^Here's (the|a) (improved|rephrased|shortened|expanded|corrected) (content|version):?\s*/i, '');
  content = content.replace(/^Improved (content|version):?\s*/i, '');
  content = content.replace(/^Rephrased (content|version):?\s*/i, '');
  content = content.replace(/^Shortened (content|version):?\s*/i, '');
  content = content.replace(/^Expanded (content|version):?\s*/i, '');
  content = content.replace(/^Corrected (content|version):?\s*/i, '');

  // Remove markdown formatting if present
  content = content.replace(/^```[\w]*\n?|\n?```$/g, '');

  // Trim whitespace
  content = content.trim();

  // Ensure it ends with proper punctuation if it's a complete text
  if (content.length > 0 && !content.match(/[.!?]$/) && action !== 'grammar') {
    content += '.';
  }

  return content;
}
