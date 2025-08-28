import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PlanTasksDto {
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsOptional()
  todoist_api_key: string;

  @IsString()
  @IsOptional()
  anthropic_api_key?: string;

  @IsString()
  @IsOptional()
  openai_api_key?: string;
}

export class McpToolCallDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  arguments: PlanTasksDto;
}
