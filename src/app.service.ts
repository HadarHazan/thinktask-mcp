import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
🎯 ThinkTask: Intelligent Todoist MCP Service

Transform any natural language instruction into perfect Todoist structure.

Examples:
• "Plan my wedding for May 15" → Complete wedding project with venues, catering, photography sections
• "Launch my consulting business" → Business launch project with research, legal, marketing phases  
• "Call mom tomorrow at 2pm" → Scheduled task with proper timing

🔧 MCP Endpoint: /api/mcp
📋 Available tools: /api/mcp/tools
❤️ Health check: /api/mcp/health

Ready to revolutionize your task planning! 🚀
    `;
  }
}
