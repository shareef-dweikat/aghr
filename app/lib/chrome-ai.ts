const CHROME_AI_API_IDS = [
  "prompt",
  "summarizer",
  "writer",
  "rewriter",
  "proofreader",
  "translator",
  "language-detector",
] as const;

type ChromeAiApiId = (typeof CHROME_AI_API_IDS)[number];

export type ChromeAiAvailabilityStatus =
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

const ENGLISH_TEXT_OPTIONS = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

const ENGLISH_INPUT_OPTIONS = {
  expectedInputLanguages: ["en"],
};

function normalizeAvailability(
  result: ChromeAiAvailability | null,
): ChromeAiAvailabilityStatus {
  if (
    result === "available" ||
    result === "downloadable" ||
    result === "downloading"
  ) {
    return result;
  }

  return "unavailable";
}

async function probe(
  isSupported: boolean,
  query: () => Promise<ChromeAiAvailability | null>,
): Promise<ChromeAiAvailabilityStatus> {
  if (!isSupported) {
    return "unsupported";
  }

  try {
    return normalizeAvailability(await query());
  } catch {
    return "unavailable";
  }
}

const AVAILABILITY_PROBES: Record<
  ChromeAiApiId,
  () => Promise<ChromeAiAvailabilityStatus>
> = {
  prompt: () =>
    probe("LanguageModel" in window, () =>
      LanguageModel.availability(ENGLISH_TEXT_OPTIONS),
    ),
  summarizer: () =>
    probe("Summarizer" in window, () =>
      Summarizer.availability(ENGLISH_INPUT_OPTIONS),
    ),
  writer: () =>
    probe("Writer" in window, () => Writer.availability(ENGLISH_INPUT_OPTIONS)),
  rewriter: () =>
    probe("Rewriter" in window, () =>
      Rewriter.availability(ENGLISH_INPUT_OPTIONS),
    ),
  proofreader: () =>
    probe("Proofreader" in window, () =>
      Proofreader.availability(ENGLISH_INPUT_OPTIONS),
    ),
  translator: () =>
    probe("Translator" in window, () =>
      Translator.availability({
        sourceLanguage: "en",
        targetLanguage: "es",
      }),
    ),
  "language-detector": () =>
    probe("LanguageDetector" in window, () =>
      LanguageDetector.availability(ENGLISH_INPUT_OPTIONS),
    ),
};

function isChromeAiApiId(id: string): id is ChromeAiApiId {
  return (CHROME_AI_API_IDS as readonly string[]).includes(id);
}

export async function checkApiAvailability(
  id: string,
): Promise<ChromeAiAvailabilityStatus> {
  if (!isChromeAiApiId(id)) {
    return "unsupported";
  }

  return AVAILABILITY_PROBES[id]();
}
