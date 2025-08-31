#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { AiService } from './services/ai.service';
import { TasksService } from './services/tasks.service';
import { McpService } from './services/mcp.service';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';

// Patch NestJS logger to use stderr only
Logger.overrideLogger({
  log: (...args: unknown[]) => console.error(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.error(...args),
  debug: () => {},
  verbose: () => {},
});

interface ToolArguments {
  instruction: string;
  todoist_api_key: string;
}

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

      const toolArgs = args as unknown as ToolArguments;

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
        content: `❌ Error: ${errorMessage}`,
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
