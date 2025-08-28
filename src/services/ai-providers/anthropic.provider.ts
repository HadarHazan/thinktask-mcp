import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { IAIProvider } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements IAIProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private anthropic: Anthropic;

  constructor(private readonly apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  async callModel(prompt: string): Promise<string> {
    if (!prompt?.trim()) {
      throw new Error('AnthropicProvider: Prompt must be a non-empty string');
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error(
          'AnthropicProvider: Unexpected response type from Claude',
        );
      }

      const raw = content.text;
      if (!raw) {
        throw new Error('AnthropicProvider: No response from AI');
      }

      return raw;
    } catch (error) {
      this.logger.error('AnthropicProvider: AI model call failed:', error);
      throw new Error(
        `AnthropicProvider : AI model call failed: ${error instanceof Error ? error.message : 'AnthropicProvider: Unknown error'}`,
      );
    }
  }
}
