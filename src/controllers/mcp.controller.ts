/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import {
  McpService,
  McpToolCall,
  McpToolResult,
} from '../services/mcp.service';

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
  async callTool(@Body() request: McpToolCall): Promise<McpToolResult> {
    this.logger.log(`🔧 Tool called: ${request.name}`);

    try {
      const result = await this.mcpService.handleToolCall(request);
      this.logger.log(`✅ Tool execution completed: ${request.name}`);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `❌ Tool execution failed: ${err.message}`,
          err.stack,
        );
        return {
          content: `❌ Tool execution failed: ${err.message}`,
          isError: true,
        };
      } else {
        this.logger.error(`❌ Tool execution failed: ${String(err)}`);
        return {
          content: `❌ Tool execution failed: ${String(err)}`,
          isError: true,
        };
      }
    }
  }

  @Get('health')
  health() {
    this.logger.log('Health check endpoint called');
    return {
      status: 'healthy',
      service: 'ThinkTask MCP Service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('')
  info() {
    return {
      name: 'ThinkTask: Intelligent Todoist MCP Service',
      description:
        'Transform any natural language instruction into perfect Todoist structure',
      version: '1.0.0',
      author: 'Hadar Hazan',
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
