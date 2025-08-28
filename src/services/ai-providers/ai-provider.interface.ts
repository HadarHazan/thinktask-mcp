export interface IAIProvider {
  /**
   * Calls the AI model with the given prompt and returns the raw response
   */
  callModel(prompt: string): Promise<string>;
}
