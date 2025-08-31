import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PlanTasksDto {
  @IsString()
  @IsNotEmpty()
  declare instruction: string;

  @IsString()
  @IsOptional()
  declare todoist_api_key: string;

  @IsString()
  @IsOptional()
  declare anthropic_api_key?: string;
}

export class McpToolCallDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  declare arguments: PlanTasksDto;
}
