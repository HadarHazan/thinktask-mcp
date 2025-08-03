export class TodoistApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'TodoistApiError';
  }
}

export class AnthropicApiError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'AnthropicApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class McpProtocolError extends Error {
  constructor(
    message: string,
    public toolName?: string,
  ) {
    super(message);
    this.name = 'McpProtocolError';
  }
}
