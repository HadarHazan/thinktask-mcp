import { Controller, Post, Get, Body, Header } from '@nestjs/common';
import { McpService } from '../services/mcp.service';

@Controller('api/siri-task')
export class SiriTasksController {
  constructor(private readonly mcpService: McpService) {}

  @Get('health')
  health() {
    return {
      status: 'healthy',
      service: 'ThinkTask MCP Service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoint: 'siri-task',
    };
  }

  @Post()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async handleSiriTask(
    @Body()
    body: {
      text: string;
      todoiestApiKey?: string;
      anthropicApiKey?: string;
      openaiApiKey?: string;
    },
  ) {
    const result = await this.mcpService.handleToolCall({
      name: 'plan_intelligent_tasks',
      arguments: {
        instruction: body.text,
        todoist_api_key: body.todoiestApiKey || 'todoiestApiKey',
        anthropic_api_key: body.anthropicApiKey,
        openai_api_key: body.openaiApiKey,
      },
    });
    return result.content;
  }
}
