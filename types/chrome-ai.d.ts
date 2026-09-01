type LanguageModelAvailability =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

interface LanguageModelPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
  prefix?: boolean;
}

interface LanguageModelPromptOptions {
  responseConstraint?: object;
  omitResponseConstraintInput?: boolean;
  signal?: AbortSignal;
}

interface LanguageModelCreateOptions {
  signal?: AbortSignal;
  initialPrompts?: LanguageModelPromptMessage[];
  monitor?: (monitor: EventTarget) => void;
  expectedInputs?: Array<{ type: string; languages?: string[] }>;
  expectedOutputs?: Array<{ type: string; languages?: string[] }>;
}

interface LanguageModelSession {
  prompt(
    input: string | LanguageModelPromptMessage[],
    options?: LanguageModelPromptOptions,
  ): Promise<string>;
  promptStreaming(
    input: string | LanguageModelPromptMessage[],
    options?: LanguageModelPromptOptions,
  ): AsyncIterable<string>;
  destroy(): void;
  contextUsage: number;
  contextWindow: number;
}

interface LanguageModel {
  availability(
    options?: LanguageModelCreateOptions,
  ): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

declare const LanguageModel: LanguageModel;
