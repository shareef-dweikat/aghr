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

type WriterTone = "formal" | "neutral" | "casual";
type WriterFormat = "plain-text" | "markdown";
type WriterLength = "short" | "medium" | "long";

interface WriterCreateOptions {
  sharedContext?: string;
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface WriterWriteOptions {
  context?: string;
  signal?: AbortSignal;
}

interface WriterSession {
  write(input: string, options?: WriterWriteOptions): Promise<string>;
  writeStreaming(
    input: string,
    options?: WriterWriteOptions,
  ): AsyncIterable<string>;
  destroy(): void;
}

interface Writer {
  availability(
    options?: LanguageAwareAvailabilityOptions &
      Pick<
        WriterCreateOptions,
        "tone" | "format" | "length" | "expectedInputLanguages" | "outputLanguage"
      >,
  ): Promise<ChromeAiAvailability | null>;
  create(options?: WriterCreateOptions): Promise<WriterSession>;
}

type RewriterTone = "more-formal" | "as-is" | "more-casual";
type RewriterFormat = "as-is" | "markdown" | "plain-text";
type RewriterLength = "shorter" | "as-is" | "longer";

interface RewriterCreateOptions {
  sharedContext?: string;
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface RewriterRewriteOptions {
  context?: string;
  tone?: RewriterTone;
  signal?: AbortSignal;
}

interface RewriterSession {
  rewrite(input: string, options?: RewriterRewriteOptions): Promise<string>;
  rewriteStreaming(
    input: string,
    options?: RewriterRewriteOptions,
  ): AsyncIterable<string>;
  destroy(): void;
}

interface Rewriter {
  availability(
    options?: LanguageAwareAvailabilityOptions &
      Pick<
        RewriterCreateOptions,
        "tone" | "format" | "length" | "expectedInputLanguages" | "outputLanguage"
      >,
  ): Promise<ChromeAiAvailability | null>;
  create(options?: RewriterCreateOptions): Promise<RewriterSession>;
}

interface ProofreaderCreateOptions {
  expectedInputLanguages?: string[];
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface ProofreaderProofreadOptions {
  signal?: AbortSignal;
}

interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
  type?: string;
  explanation?: string;
}

interface ProofreadResult {
  correctedInput: string;
  corrections: ProofreadCorrection[];
}

interface ProofreaderSession {
  proofread(
    input: string,
    options?: ProofreaderProofreadOptions,
  ): Promise<ProofreadResult>;
  destroy(): void;
}

interface Proofreader {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
  create(options?: ProofreaderCreateOptions): Promise<ProofreaderSession>;
}

interface TranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface TranslatorTranslateOptions {
  signal?: AbortSignal;
}

interface TranslatorSession {
  translate(
    input: string,
    options?: TranslatorTranslateOptions,
  ): Promise<string>;
  translateStreaming(
    input: string,
    options?: TranslatorTranslateOptions,
  ): AsyncIterable<string>;
  destroy(): void;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

interface Translator {
  availability(
    options: Pick<TranslatorCreateOptions, "sourceLanguage" | "targetLanguage">,
  ): Promise<ChromeAiAvailability | null>;
  create(options: TranslatorCreateOptions): Promise<TranslatorSession>;
}

interface LanguageDetectorCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetectorSession {
  detect(input: string): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

interface LanguageDetector {
  availability(
    options?: LanguageAwareAvailabilityOptions,
  ): Promise<ChromeAiAvailability | null>;
  create(
    options?: LanguageDetectorCreateOptions,
  ): Promise<LanguageDetectorSession>;
}

declare const LanguageModel: LanguageModel;
declare const Summarizer: Summarizer;
declare const Writer: Writer;
declare const Rewriter: Rewriter;
declare const Proofreader: Proofreader;
declare const Translator: Translator;
declare const LanguageDetector: LanguageDetector;
