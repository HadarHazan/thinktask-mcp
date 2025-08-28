import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { TasksService } from './tasks.service';
import { PlanTasksDto } from '../dto/mcp.dto';
import {
  TodoistAction,
  ActionExecutionResult,
} from '../interfaces/todoist.interface';
import { AIServiceConfig } from '../interfaces/ai.interface';
import { McpToolCall, McpToolResult } from '../interfaces/mcp.interface';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly tasksService: TasksService,
  ) {}

  async handleToolCall(toolCall: McpToolCall): Promise<McpToolResult> {
    try {
      switch (toolCall.name) {
        case 'plan_intelligent_tasks': {
          return await this.planIntelligentTasks(toolCall.arguments);
        }
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Tool execution failed: ${errorMessage}`);

      return {
        content: `❌ Error: ${errorMessage}`,
        isError: true,
      };
    }
  }

  private async planIntelligentTasks(
    args: PlanTasksDto,
  ): Promise<McpToolResult> {
    const { instruction } = args;
    const todoist_api_key =
      args.todoist_api_key || process.env.TODOIST_API_TOKEN;

    // Create AI service configuration
    const aiConfig: AIServiceConfig = {
      anthropic_api_key:
        args.anthropic_api_key || process.env.ANTHROPIC_API_KEY,
      openai_api_key: args.openai_api_key || process.env.OPENAI_API_KEY,
    };

    // Validate required parameters
    if (!instruction?.trim()) {
      throw new Error('Instruction is required and cannot be empty');
    }

    if (!todoist_api_key?.trim()) {
      return {
        content:
          '⚠️ No Todoist API key provided. Please provide a todoist_api_key in the request or set the TODOIST_API_TOKEN environment variable if you want to use Todoist features.',
        isError: true,
      };
    }

    // Check if any AI provider is available
    const hasAnthropicKey = !!aiConfig.anthropic_api_key;
    const hasOpenAIKey = !!aiConfig.openai_api_key;

    if (!hasAnthropicKey && !hasOpenAIKey) {
      return {
        content:
          '⚠️ No AI API key provided. Please provide either an anthropic_api_key or openai_api_key in the request, or set the ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables.',
        isError: true,
      };
    }

    // Validate Todoist API key
    const isValidTodoistKey =
      await this.tasksService.validateTodoistApiKey(todoist_api_key);
    if (!isValidTodoistKey) {
      throw new Error('Invalid Todoist API key provided');
    }

    try {
      // Create AI provider once for this request
      const aiProvider = this.aiService.createProvider(aiConfig);

      const endpoints = await this.aiService.determineRequiredFetches(
        instruction,
        aiProvider,
      );
      this.logger.log('⚡ Executing Todoist API endpoints...');
      const preparsionData = await this.tasksService.executeEndpoints(
        endpoints,
        todoist_api_key,
      );

      // Parse the instruction with AI
      this.logger.log('🤖 Processing instruction with AI...');
      const actions = await this.aiService.parseTask(
        instruction,
        preparsionData,
        aiProvider,
      );

      this.logger.log(`📋 Generated ${actions.length} actions to execute`);

      // Execute the actions
      this.logger.log('⚡ Executing Todoist API calls...');
      const results = await this.tasksService.executeActions(
        actions,
        todoist_api_key,
      );

      // Format the response
      const createdItems = this.formatCreatedItems(results, actions);
      const summary = this.generateSummary(actions, results);

      return {
        content: `✅ **Plan created successfully!** ${createdItems}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Planning execution failed:', errorMessage);
      throw new Error(`Planning failed: ${errorMessage}`);
    }
  }

  private formatCreatedItems(
    results: Map<string, ActionExecutionResult>,
    actions: TodoistAction[],
  ): string {
    const items: string[] = [];

    actions.forEach((action) => {
      const result = results.get(action.id);
      if (result?.success && result.data) {
        const emoji = this.getEmojiForEndpoint(action.endpoint);
        const name = this.extractNameFromResult(result.data) || 'Unnamed item';

        let dateInfo = this.getDateInfo(action, result.data);

        items.push(`${emoji} ${name}${dateInfo}`);
      }
    });

    return items.length > 0 ? items.join('\n') : 'No items created';
  }

  private getDateInfo(action: TodoistAction, data: any): string {
    let dueString = '';
    let dueDate = '';

    // Try to get from action body
    if (action.body) {
      dueString = (action.body as any).due_string || '';
      dueDate = (action.body as any).due_date || '';
    }

    // Try to get from result data
    if (data && typeof data === 'object' && data.due) {
      dueString = data.due.string || dueString;
      dueDate = data.due.date || dueDate;
    }

    if (dueString) {
      return ` - ${dueString}`;
    } else if (dueDate) {
      return ` - ${dueDate}`;
    }

    return '';
  }

  private extractNameFromResult(data: unknown): string | null {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      if (typeof obj.name === 'string') return obj.name;
      if (typeof obj.content === 'string') return obj.content;
    }

    return null;
  }

  private generateSummary(
    actions: TodoistAction[],
    results: Map<string, ActionExecutionResult>,
  ): string {
    const counts = {
      projects: 0,
      sections: 0,
      tasks: 0,
    };

    actions.forEach((action) => {
      const result = results.get(action.id);
      if (result?.success) {
        if (action.endpoint === 'projects') counts.projects++;
        else if (action.endpoint === 'sections') counts.sections++;
        else if (action.endpoint === 'tasks') counts.tasks++;
      }
    });

    const parts: string[] = [];
    if (counts.projects > 0) {
      parts.push(`${counts.projects} project${counts.projects > 1 ? 's' : ''}`);
    }
    if (counts.sections > 0) {
      parts.push(`${counts.sections} section${counts.sections > 1 ? 's' : ''}`);
    }
    if (counts.tasks > 0) {
      parts.push(`${counts.tasks} task${counts.tasks > 1 ? 's' : ''}`);
    }

    return parts.length > 0
      ? `Successfully created ${parts.join(', ')}.`
      : 'No items were created.';
  }

  private getEmojiForEndpoint(endpoint: string): string {
    switch (endpoint) {
      case 'projects':
        return '📁';
      case 'sections':
        return '📂';
      case 'tasks':
        return '✅';
      default:
        return '📋';
    }
  }

  getToolsDefinition(): Array<{
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
          enum?: string[];
        }
      >;
      required: string[];
    };
  }> {
    return [
      {
        name: 'plan_intelligent_tasks',
        description:
          'Transform any natural language instruction into comprehensive Todoist projects, sections, and tasks with intelligent scheduling and organization. Supports both Anthropic Claude and OpenAI GPT models for AI-powered task planning.',
        inputSchema: {
          type: 'object',
          properties: {
            instruction: {
              type: 'string',
              description:
                'Natural language instruction describing what you want to accomplish. Examples: "Plan my wedding for May 15", "Launch my consulting business", "Call mom tomorrow at 2pm", "Organize a move to a new apartment next month"',
            },
            todoist_api_key: {
              type: 'string',
              description:
                'Your Todoist API key (optional). If not provided, the service will use the TODOIST_API_TOKEN environment variable.',
            },
            anthropic_api_key: {
              type: 'string',
              description:
                'Your Anthropic API key (optional). If not provided, the service will use the ANTHROPIC_API_KEY environment variable.',
            },
            openai_api_key: {
              type: 'string',
              description:
                'Your OpenAI API key (optional). If not provided, the service will use the OPENAI_API_KEY environment variable. The service will automatically detect which AI provider to use based on the provided API keys.',
            },
          },
          required: ['instruction'],
        },
      },
    ];
  }
}
