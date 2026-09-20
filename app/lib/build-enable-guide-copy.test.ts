import { describe, expect, it } from "vitest";

import {
  buildEnableGuideCopy,
  type EnableGuideConfig,
} from "./build-enable-guide-copy";

const OPTIMIZATION_URL =
  "chrome://flags/#optimization-guide-on-device-model";
const VERIFY_URL = "chrome://on-device-internals";
const MULTIMODAL_URL =
  "chrome://flags/#prompt-api-for-gemini-nano-multimodal-input";

function baseGuide(
  byApi: EnableGuideConfig["byApi"] = {},
): EnableGuideConfig {
  return {
    howToEnableHint: "How to enable",
    titleTemplate: "Enable {apiName}",
    introTemplate: "Intro for {apiName}.",
    close: "Close",
    chromeVersionStep: "Use Chrome 148+.",
    apiFlagStepSingular: "Open this flag and set it to Enabled.",
    apiFlagStepPlural: "Open these flags and set each to Enabled.",
    optimizationGuideStep: {
      text: "Open this flag and set it to Enabled BypassPerfRequirement.",
      urls: [OPTIMIZATION_URL],
    },
    restartStep: "Restart Chrome.",
    verifyStep: {
      text: "Verify status here.",
      urls: [VERIFY_URL],
    },
    downloadNotes: {
      geminiNano: "Gemini Nano ~4 GB note.",
      expert: "Expert model note.",
    },
    copy: "Copy",
    copied: "Copied",
    docsLink: "Official docs",
    byApi,
  };
}

describe("buildEnableGuideCopy", () => {
  it("returns null when byApi metadata is missing", () => {
    expect(
      buildEnableGuideCopy({ id: "prompt", name: "Prompt API" }, baseGuide()),
    ).toBeNull();
  });

  it("fills title and intro templates with the API name", () => {
    const copy = buildEnableGuideCopy(
      { id: "prompt", name: "Prompt API" },
      baseGuide({
        prompt: {
          flagUrls: ["chrome://flags/#prompt-api-for-gemini-nano"],
          docsHref: "https://developer.chrome.com/docs/ai/prompt-api",
          modelFamily: "geminiNano",
        },
      }),
    );

    expect(copy?.title).toBe("Enable Prompt API");
    expect(copy?.intro).toBe("Intro for Prompt API.");
    expect(copy?.docsHref).toBe(
      "https://developer.chrome.com/docs/ai/prompt-api",
    );
  });

  it("uses singular API-flag step text for one flag URL", () => {
    const copy = buildEnableGuideCopy(
      { id: "summarizer", name: "Summarizer API" },
      baseGuide({
        summarizer: {
          flagUrls: ["chrome://flags/#summarization-api-for-gemini-nano"],
          docsHref: "https://developer.chrome.com/docs/ai/summarizer-api",
          modelFamily: "geminiNano",
        },
      }),
    );

    const flagStep = copy?.steps.find((step) =>
      step.urls?.includes("chrome://flags/#summarization-api-for-gemini-nano"),
    );
    expect(flagStep?.text).toBe("Open this flag and set it to Enabled.");
    expect(flagStep?.urls).toEqual([
      "chrome://flags/#summarization-api-for-gemini-nano",
    ]);
  });

  it("uses plural API-flag step text and multiple URLs for Writer", () => {
    const writerFlag = "chrome://flags/#writer-api-for-gemini-nano";
    const copy = buildEnableGuideCopy(
      { id: "writer", name: "Writer API" },
      baseGuide({
        writer: {
          flagUrls: [MULTIMODAL_URL, writerFlag],
          docsHref: "https://developer.chrome.com/docs/ai/writer-api",
          modelFamily: "geminiNano",
        },
      }),
    );

    const flagStep = copy?.steps.find((step) =>
      step.urls?.includes(writerFlag),
    );
    expect(flagStep?.text).toBe("Open these flags and set each to Enabled.");
    expect(flagStep?.urls).toEqual([MULTIMODAL_URL, writerFlag]);
  });

  it("includes optimization-guide and Gemini Nano note for geminiNano APIs", () => {
    const copy = buildEnableGuideCopy(
      { id: "prompt", name: "Prompt API" },
      baseGuide({
        prompt: {
          flagUrls: ["chrome://flags/#prompt-api-for-gemini-nano"],
          docsHref: "https://developer.chrome.com/docs/ai/prompt-api",
          modelFamily: "geminiNano",
        },
      }),
    );

    expect(copy?.downloadNote).toBe("Gemini Nano ~4 GB note.");
    expect(
      copy?.steps.some((step) => step.urls?.includes(OPTIMIZATION_URL)),
    ).toBe(true);
    expect(copy?.steps.map((step) => step.text)).toEqual([
      "Use Chrome 148+.",
      "Open this flag and set it to Enabled.",
      "Open this flag and set it to Enabled BypassPerfRequirement.",
      "Restart Chrome.",
      "Verify status here.",
    ]);
  });

  it("omits optimization-guide and uses expert note for expert APIs", () => {
    const copy = buildEnableGuideCopy(
      { id: "translator", name: "Translator API" },
      baseGuide({
        translator: {
          flagUrls: ["chrome://flags/#translation-api"],
          docsHref: "https://developer.chrome.com/docs/ai/translator-api",
          modelFamily: "expert",
        },
      }),
    );

    expect(copy?.downloadNote).toBe("Expert model note.");
    expect(
      copy?.steps.some((step) => step.urls?.includes(OPTIMIZATION_URL)),
    ).toBe(false);
    expect(copy?.steps.map((step) => step.text)).toEqual([
      "Use Chrome 148+.",
      "Open this flag and set it to Enabled.",
      "Restart Chrome.",
      "Verify status here.",
    ]);
  });
});
