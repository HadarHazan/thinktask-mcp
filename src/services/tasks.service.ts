/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

interface TodoistProject {
  id: string;
  name: string;
  comment_count?: number;
  order?: number;
  color?: string;
  is_shared?: boolean;
  is_favorite?: boolean;
  is_inbox_project?: boolean;
  is_team_inbox?: boolean;
  view_style?: string;
  url?: string;
  parent_id?: string;
}

interface TodoistSection {
  id: string;
  project_id: string;
  order: number;
  name: string;
}

interface TodoistAction {
  id: string;
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  depends_on?: string | string[];
}

interface ActionExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchAllProjects(apiKey: string): Promise<string> {
    try {
      const response: AxiosResponse<TodoistProject[]> = await firstValueFrom(
        this.httpService.get(`${TODOIST_API_URL}/projects`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      );
      return JSON.stringify(response.data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to fetch projects:', errorMessage);
      throw new Error(`Failed to fetch projects: ${errorMessage}`);
    }
  }

  async fetchAllSections(apiKey: string): Promise<string> {
    try {
      const response: AxiosResponse<TodoistSection[]> = await firstValueFrom(
        this.httpService.get(`${TODOIST_API_URL}/sections`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      );
      return JSON.stringify(response.data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to fetch sections:', errorMessage);
      throw new Error(`Failed to fetch sections: ${errorMessage}`);
    }
  }

  async executeActions(
    actions: TodoistAction[],
    apiKey: string,
  ): Promise<Map<string, ActionExecutionResult>> {
    const results = new Map<string, ActionExecutionResult>();

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, apiKey, results);
        results.set(action.id, { success: true, data: result });
        this.logger.log(`✅ Action ${action.id} completed successfully`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.set(action.id, { success: false, error: errorMessage });

        this.logger.error(
          `❌ Error executing action ${action.id}: ${errorMessage}`,
        );
        throw new Error(`Error executing action ${action.id}: ${errorMessage}`);
      }
    }

    return results;
  }

  private async executeAction(
    action: TodoistAction,
    apiKey: string,
    previousResults: Map<string, ActionExecutionResult>,
  ): Promise<unknown> {
    const url = `${TODOIST_API_URL}/${action.endpoint}`;
    const method = action.method.toLowerCase();

    // Resolve placeholders in the body
    const body = this.resolvePlaceholders(action.body, previousResults);

    const requestConfig = {
      url,
      method: method as 'get' | 'post' | 'put' | 'delete' | 'patch',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(method === 'get' ? { params: body } : { data: body }),
    };

    const response: AxiosResponse<unknown> = await firstValueFrom(
      this.httpService.request(requestConfig),
    );

    return response.data || null;
  }

  private resolvePlaceholders(
    obj: Record<string, unknown>,
    results: Map<string, ActionExecutionResult>,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = this.resolveValue(value, results);
    }

    return resolved;
  }

  private resolveValue(
    value: unknown,
    results: Map<string, ActionExecutionResult>,
  ): unknown {
    if (typeof value === 'string') {
      return value.replace(/\{([^}]+)\}/g, (_, key: string) => {
        const [refId, prop] = key.split('.');
        const result = results.get(refId);

        if (!result?.success || !result.data) {
          return '';
        }

        if (!prop) {
          return typeof result.data === 'object' && result.data !== null
            ? JSON.stringify(result.data)
            : String(result.data);
        }

        const data = result.data as Record<string, unknown>;
        const replacement = data[prop];

        if (replacement === undefined || replacement === null) {
          return '';
        }

        return typeof replacement === 'object'
          ? JSON.stringify(replacement)
          : String(replacement);
      });
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, results));
    }

    if (typeof value === 'object' && value !== null) {
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        resolved[k] = this.resolveValue(v, results);
      }
      return resolved;
    }

    return value;
  }

  async validateTodoistApiKey(apiKey: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${TODOIST_API_URL}/projects`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Invalid Todoist API key:', errorMessage);
      return false;
    }
  }
}
