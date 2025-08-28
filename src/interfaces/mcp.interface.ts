import { PlanTasksDto } from '../dto/mcp.dto';

export interface McpToolCall {
  name: string;
  arguments: PlanTasksDto;
}

export interface McpToolResult {
  content: string;
  isError?: boolean;
}
