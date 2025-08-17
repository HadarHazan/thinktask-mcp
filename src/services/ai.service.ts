import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { determineRequiredPrompt } from './determineRequiredPrompt';
import { parseTaskPrompt } from './parseTaskPrompt';

interface TodoistAction {
  id: string;
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  depends_on?: string | string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async determineRequiredFetches(
    text: string,
    anthropic_api_key: string,
  ): Promise<string[]> {
    if (!text?.trim()) {
      throw new Error('Input text must be a non-empty string');
    }

    const anthropic = new Anthropic({
      apiKey: anthropic_api_key,
    });

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: determineRequiredPrompt(text),
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const raw = content.text;
      if (!raw) {
        throw new Error('No response from AI');
      }

      return this.extractStringArrayFromText(raw);
    } catch (error) {
      this.logger.error('AI parsing failed:', error);
      throw new Error(
        `AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async parseTask(
    text: string,
    preparsionData: string,
    anthropic_api_key: string,
  ): Promise<TodoistAction[]> {
    if (!text?.trim()) {
      throw new Error('Input text must be a non-empty string');
    }
    this.logger.log(`user instructions ${text}`);

    const anthropic = new Anthropic({
      apiKey: anthropic_api_key,
    });

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: parseTaskPrompt(text, preparsionData),
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const raw = content.text;
      if (!raw) {
        throw new Error('No response from AI');
      }

      return this.extractJsonFromText(raw);
    } catch (error) {
      this.logger.error('AI parsing failed:', error);
      throw new Error(
        `AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private extractJsonFromText(raw: string): TodoistAction[] {
    // Try to find JSON wrapped in code blocks first
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = raw.match(jsonRegex);
    const jsonString = match ? match[1] : raw.trim();

    try {
      const parsed = JSON.parse(jsonString) as unknown;

      if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array from AI response');
      }

      // Validate each action has required properties
      const actions: TodoistAction[] = parsed.map((item, index) => {
        if (typeof item !== 'object' || item === null) {
          throw new Error(`Action at index ${index} is not an object`);
        }

        const action = item as Record<string, unknown>;

        if (typeof action.id !== 'string') {
          throw new Error(`Action at index ${index} missing valid id`);
        }
        if (typeof action.endpoint !== 'string') {
          throw new Error(`Action at index ${index} missing valid endpoint`);
        }
        if (typeof action.method !== 'string') {
          throw new Error(`Action at index ${index} missing valid method`);
        }

        return {
          id: action.id,
          endpoint: action.endpoint,
          method: action.method,
          body: action.body as Record<string, unknown>,
          depends_on: action.depends_on as string | string[] | undefined,
        };
      });

      return actions;
    } catch (error) {
      this.logger.error('JSON parsing failed:', error);
      this.logger.error('Raw response:', raw);
      throw new Error(
        `Invalid JSON response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private extractStringArrayFromText(raw: string): string[] {
    // 1. Try to extract JSON code block from ```json ... ```
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const codeBlockMatch = raw.match(codeBlockRegex);
    let jsonString = codeBlockMatch?.[1]?.trim();

    // 2. If not found, look for the first array in the text (between square brackets)
    if (!jsonString) {
      const arrayRegex = /\[[\s\S]*?\]/;
      const arrayMatch = raw.match(arrayRegex);
      jsonString = arrayMatch?.[0]?.trim();
    }

    // 3. If still not found, throw an error
    if (!jsonString) {
      throw new Error('Could not find JSON array in AI response');
    }

    try {
      const parsed = JSON.parse(jsonString);

      // 4. Validate that the parsed result is an array
      if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array');
      }

      // 5. Ensure all items in the array are strings
      const isValid = parsed.every((item) => typeof item === 'string');
      if (!isValid) {
        throw new Error('Array contains non-string items');
      }

      return parsed;
    } catch (error) {
      this.logger.error(
        'Failed to parse string array from AI response:',
        error,
      );
      this.logger.error('Raw response:', raw);
      throw new Error(
        `Invalid string array response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
