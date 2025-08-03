#!/usr/bin/env node
import * as readline from 'readline';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { McpService } from '../../src/services/mcp.service';
import { McpToolCallDto } from '../../src/dto/mcp.dto';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const mcpService = app.get(McpService);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (input) => {
    let message;
    try {
      message = JSON.parse(input);
    } catch (err) {
      process.stderr.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
            data: err?.toString(),
          },
        }) + '\n',
      );
      return;
    }

    try {
      if (message.method === 'getTools') {
        const result = { tools: mcpService.getToolsDefinition() };
        process.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n',
        );
      } else if (message.method === 'callTool') {
        const params: McpToolCallDto = message.params;
        const result = await mcpService.handleToolCall(params);
        process.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n',
        );
      } else if (message.method === 'health') {
        const result = {
          status: 'healthy',
          service: 'ThinkTask MCP Service',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        };
        process.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n',
        );
      } else if (message.method === 'info') {
        const result = {
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
        process.stdout.write(
          JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n',
        );
      } else if (message.method === 'initialize') {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: { capabilities: {} },
          }) + '\n',
        );
      } else {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32601, message: 'Method not found' },
          }) + '\n',
        );
      }
    } catch (err) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32000, message: 'Internal error' },
        }) + '\n',
      );
    }
  });
}

main();
