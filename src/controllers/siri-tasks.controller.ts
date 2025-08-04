import { Controller, Post, Body } from '@nestjs/common';
import { McpService } from '../services/mcp.service';

@Controller('api/siri-task')
export class SiriTasksController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  async handleSiriTask(
    @Body()
    body: {
      text: string;
      todoiestApiKey?: string;
      anthropic_api_key?: string;
    },
  ) {
    const task = await this.mcpService.handleToolCall({
      name: 'plan_intelligent_tasks',
      arguments: {
        instruction: body.text,
        todoist_api_key: body.todoiestApiKey || 'todoiestApiKey',
        anthropic_api_key: body.anthropic_api_key || 'anthropic_api_key',
      },
    });
    return {
      message: task,
    };
  }
}
