type ChromeAiAvailability =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

type LanguageModelAvailability = ChromeAiAvailability;

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
  ): Promise<ChromeAiAvailability | null>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

interface LanguageAwareAvailabilityOptions {
  expectedInputLanguages?: string[];
}

type SummarizerType = "key-points" | "tldr" | "teaser" | "headline";
type SummarizerFormat = "markdown" | "plain-text";
type SummarizerLength = "short" | "medium" | "long";

interface SummarizerCreateOptions {
  sharedContext?: string;
  type?: SummarizerType;
  format?: SummarizerFormat;
  length?: SummarizerLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface SummarizerSummarizeOptions {
  context?: string;
  signal?: AbortSignal;
}

interface SummarizerSession {
  summarize(
    input: string,
    options?: SummarizerSummarizeOptions,
  ): Promise<string>;
  summarizeStreaming(
    input: string,
    options?: SummarizerSummarizeOptions,
  ): AsyncIterable<string>;
  destroy(): void;
}

interface Summarizer {
  availability(
    options?: LanguageAwareAvailabilityOptions &
      Pick<
        SummarizerCreateOptions,
        "type" | "format" | "length" | "expectedInputLanguages" | "outputLanguage"
      >,
  ): Promise<ChromeAiAvailability | null>;
  create(options?: SummarizerCreateOptions): Promise<SummarizerSession>;
}

interface Writer {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
}

interface Rewriter {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
}

interface Proofreader {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
}

interface TranslatorAvailabilityOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Translator {
  availability(
    options: TranslatorAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
}

interface LanguageDetector {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
}

declare const LanguageModel: LanguageModel;
declare const Summarizer: Summarizer;
declare const Writer: Writer;
declare const Rewriter: Rewriter;
declare const Proofreader: Proofreader;
declare const Translator: Translator;
declare const LanguageDetector: LanguageDetector;
