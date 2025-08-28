export interface TodoistAction {
  id: string;
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
  depends_on?: string | string[];
}

export interface ActionExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
