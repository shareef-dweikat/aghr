import type { EnableGuideCopy, EnableGuideStep } from "../components/enable-chrome-ai-modal";

export type EnableGuideModelFamily = "geminiNano" | "expert";

export type EnableGuideByApi = {
  flagUrls: string[];
  docsHref: string;
  modelFamily: EnableGuideModelFamily;
};

export type EnableGuideConfig = {
  howToEnableHint: string;
  titleTemplate: string;
  introTemplate: string;
  close: string;
  chromeVersionStep: string;
  apiFlagStepSingular: string;
  apiFlagStepPlural: string;
  optimizationGuideStep: EnableGuideStep;
  restartStep: string;
  verifyStep: EnableGuideStep;
  downloadNotes: Record<EnableGuideModelFamily, string>;
  copy: string;
  copied: string;
  docsLink: string;
  byApi: Record<string, EnableGuideByApi>;
};

function fillApiName(template: string, apiName: string): string {
  return template.replaceAll("{apiName}", apiName);
}

export function buildEnableGuideCopy(
  api: { id: string; name: string },
  guide: EnableGuideConfig,
): EnableGuideCopy | null {
  const meta = guide.byApi[api.id];
  if (!meta) {
    return null;
  }

  const steps: EnableGuideStep[] = [
    { text: guide.chromeVersionStep },
    {
      text:
        meta.flagUrls.length > 1
          ? guide.apiFlagStepPlural
          : guide.apiFlagStepSingular,
      urls: meta.flagUrls,
    },
  ];

  if (meta.modelFamily === "geminiNano") {
    steps.push({
      text: guide.optimizationGuideStep.text,
      urls: guide.optimizationGuideStep.urls,
    });
  }

  steps.push({ text: guide.restartStep });
  steps.push({
    text: guide.verifyStep.text,
    urls: guide.verifyStep.urls,
  });

  return {
    title: fillApiName(guide.titleTemplate, api.name),
    intro: fillApiName(guide.introTemplate, api.name),
    close: guide.close,
    steps,
    downloadNote: guide.downloadNotes[meta.modelFamily],
    copy: guide.copy,
    copied: guide.copied,
    docsLink: guide.docsLink,
    docsHref: meta.docsHref,
  };
}
