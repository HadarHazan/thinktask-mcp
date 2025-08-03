#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { AiService } from './services/ai.service.js';
import { TasksService } from './services/tasks.service.js';
import { McpService } from './services/mcp.service.js';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { PlanTasksDto } from './dto/mcp.dto.js';

// Patch NestJS logger to use stderr only
Logger.overrideLogger({
  log: (...args: any[]) => console.error(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => {},
  verbose: (...args: any[]) => {},
});

// Create services instances
const httpService = new HttpService();
const aiService = new AiService();
const tasksService = new TasksService(httpService);
const mcpService = new McpService(aiService, tasksService);

// Create the server
const server = new Server({
  name: 'thinktask-mcp',
  version: '1.0.0',
  capabilities: {
    tools: {},
  },
});

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: mcpService.getToolsDefinition(),
  };
});

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
      // Validate arguments structure
      if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments provided');
      }

      const toolArgs = args as unknown as PlanTasksDto;

      // Validate required fields
      if (!toolArgs.instruction || typeof toolArgs.instruction !== 'string') {
        throw new Error(
          'instruction parameter is required and must be a string',
        );
      }

      const result = await mcpService.handleToolCall({
        name,
        arguments: toolArgs,
      });

      return {
        content: result.content,
        isError: result.isError || false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Start the server
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Use stderr for logging to avoid interfering with MCP protocol on stdout
    console.error('🚀 ThinkTask MCP Server started');
    console.error(
      '📋 Ready to transform natural language into intelligent Todoist structures',
    );
  } catch (error) {
    console.error('❌ Failed to start ThinkTask MCP Server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
