/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PlanTasksDto {
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsNotEmpty()
  todoist_api_key: string;

  @IsString()
  @IsOptional()
  anthropic_api_key?: string;
}

export class McpToolCallDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  arguments: PlanTasksDto;
}
