export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface AIResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface AIProvider {
  generate(options: AIGenerateOptions): Promise<AIResponse>;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'claude';

  switch (provider) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

class ClaudeProvider implements AIProvider {
  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Claude API error ${res.status}: ${error}`);
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');

    return {
      content: textBlock?.text || '',
      usage: data.usage
        ? { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens }
        : undefined,
    };
  }
}

class OpenAIProvider implements AIProvider {
  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const body: Record<string, unknown> = {
      model: 'gpt-4o',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${error}`);
    }

    const data = await res.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage
        ? { inputTokens: data.usage.prompt_tokens, outputTokens: data.usage.completion_tokens }
        : undefined,
    };
  }
}
