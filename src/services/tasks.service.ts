import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

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

  async executeEndpoints(endpoints: string[], apiKey: string): Promise<string> {
    const resultParts: string[] = [];

    await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const url = `${TODOIST_API_URL}${endpoint}`;

          const response = await firstValueFrom(
            this.httpService.get(url, {
              headers: { Authorization: `Bearer ${apiKey}` },
            }),
          );

          const data = response.data;

          // Format as text for the AI prompt
          const formatted = `Existing ${endpoint}:\n\n"""${JSON.stringify(data, null, 2)}"""\n`;
          resultParts.push(formatted);
        } catch (error) {
          // Optional: log or handle the error per endpoint
          console.warn(`❌ Failed to fetch ${endpoint}:`, error.message);
        }
      }),
    );

    return resultParts.join('\n');
  }

  async executeActions(
    actions: TodoistAction[],
    apiKey: string,
  ): Promise<Map<string, ActionExecutionResult>> {
    const results = new Map<string, ActionExecutionResult>();

    for (const action of actions) {
      try {
        this.logger.log(
          `Row Action ${action.id}  is ${JSON.stringify(action)}`,
        );

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

    const body = this.resolvePlaceholders(action.body ?? {}, previousResults);

    const requestConfig = {
      url,
      method: method as 'get' | 'post' | 'put' | 'delete' | 'patch',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(['get', 'delete'].includes(method)
        ? { params: body }
        : { data: body }),
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
