import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IAIProvider } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements IAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI;

  constructor(private readonly apiKey: string) {
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  async callModel(prompt: string): Promise<string> {
    if (!prompt?.trim()) {
      throw new Error('OpenAIProvider: Prompt must be a non-empty string');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAIProvider: No response from OpenAI');
      }

      return content;
    } catch (error) {
      this.logger.error('OpenAIProvider: AI model call failed:', error);
      throw new Error(
        `OpenAIProvider: AI model call failed: ${error instanceof Error ? error.message : 'OpenAIProvider: Unknown error'}`,
      );
    }
  }
}
