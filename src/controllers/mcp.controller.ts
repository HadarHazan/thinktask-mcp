/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { McpService } from '../services/mcp.service';
import { McpToolCallDto, McpToolResultDto } from '../dto/mcp.dto';

@Controller('api/mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Get('tools')
  getTools() {
    return {
      tools: this.mcpService.getToolsDefinition(),
    };
  }

  @Post('call-tool')
  async callTool(@Body() request: McpToolCallDto): Promise<McpToolResultDto> {
    this.logger.log(`🔧 Tool called: ${request.name}`);

    try {
      const result = await this.mcpService.handleToolCall(request);
      this.logger.log(`✅ Tool execution completed: ${request.name}`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Tool execution failed: ${error.message}`,
        error.stack,
      );
      return {
        content: [
          {
            type: 'text',
            text: `❌ Tool execution failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Get('')
  info() {
    return {
      name: 'ThinkTask: Intelligent Todoist MCP Service',
      description:
        'Transform any natural language instruction into perfect Todoist structure',
      version: '1.0.0',
      author: 'Your Name',
      capabilities: [
        'Natural language task planning',
        'Intelligent project breakdown',
        'Dynamic scheduling with time reasoning',
        'Multi-language support',
        'Dependency resolution',
        'Comprehensive project management',
      ],
      endpoints: {
        tools: '/api/mcp/tools',
        'call-tool': '/api/mcp/call-tool',
        health: '/api/mcp/health',
      },
      ai_engine: 'Claude 3.5 Sonnet',
      integration: 'Todoist API v2',
    };
  }
}
