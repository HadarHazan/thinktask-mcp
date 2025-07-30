export const anthropicConfig = {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4000,
  defaultApiKey: process.env.ANTHROPIC_API_KEY,
};

export const validateAnthropicConfig = () => {
  if (!anthropicConfig.defaultApiKey) {
    console.warn(
      '⚠️ ANTHROPIC_API_KEY environment variable not set. Users will need to provide their own API key.',
    );
  }
};
