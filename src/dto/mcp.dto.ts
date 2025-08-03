import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsIn,
  ValidateNested,
  IsObject,
  ValidateIf,
} from 'class-validator';

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
}

export class McpToolCallDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  arguments: PlanTasksDto;
}

export class McpToolResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => McpToolResultContentDto)
  content: McpToolResultContentDto[];

  @IsOptional()
  @IsBoolean()
  isError?: boolean;
}

class McpToolResultContentDto {
  @IsString()
  @IsIn(['text'])
  type: 'text';

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ActionExecutionResultDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  data?: unknown;

  @IsOptional()
  @IsString()
  error?: string;
}

export class TodoistActionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsObject()
  body: Record<string, unknown>;

  @IsOptional()
  @ValidateIf((o) => o.depends_on !== undefined)
  @IsString()
  @IsArray()
  depends_on?: string | string[];
}
