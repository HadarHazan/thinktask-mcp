import { Controller, Post, Body, Header } from '@nestjs/common';
import { McpService } from '../services/mcp.service';

@Controller('api/siri-task')
export class SiriTasksController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async handleSiriTask(
    @Body()
    body: {
      text: string;
      todoiestApiKey?: string;
      anthropicApiKey?: string;
    },
  ) {
    const result = await this.mcpService.handleToolCall({
      name: 'plan_intelligent_tasks',
      arguments: {
        instruction: body.text,
        todoist_api_key: body.todoiestApiKey || 'todoiestApiKey',
        anthropic_api_key: body.anthropicApiKey || 'anthropicApiKey',
      },
    });
    return result.content;
  }
}
