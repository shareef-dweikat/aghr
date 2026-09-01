# aghr

A [Next.js](https://nextjs.org) demo app that uses Chrome's on-device **Prompt API** (Gemini Nano) to run LLM prompts entirely in the browser.

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Chrome Prompt API demo

The home page includes an interactive demo at `app/components/prompt-api-demo.tsx` that:

- Detects whether `LanguageModel` is available
- Checks model availability and shows download progress
- Streams responses with `promptStreaming()`
- Supports stopping generation via `AbortSignal`

Edit the prompt in the UI and click **Generate** to run it.

## Enable in Chrome

The Prompt API must be enabled before it works in a regular website:

1. Use **Chrome 148+** on desktop (Windows, macOS, Linux, or Chromebook Plus).
2. Go to `chrome://flags/#prompt-api-for-gemini-nano` and set it to **Enabled**.
3. Go to `chrome://flags/#optimization-guide-on-device-model` and set it to **Enabled BypassPerfRequirement**.
4. Restart Chrome.
5. Verify status at `chrome://on-device-internals`.

On first use, Chrome downloads the Gemini Nano model (~4 GB). This requires a user gesture (clicking **Generate**).

## Requirements and limitations

| Requirement | Details |
| --- | --- |
| Browser | Chrome 148+ desktop only — not Safari, Firefox, or mobile |
| Web availability | Behind a flag or [origin trial](https://developer.chrome.com/origintrials) for websites; stable in Chrome Extensions (138+) |
| Storage | ~22 GB free disk space |
| Network | Unmetered connection for initial model download |
| GPU | More than 4 GB VRAM, **or** 16 GB RAM + 4 CPU cores |
| User gesture | Model download must be triggered by user interaction |

Data stays on-device — no API keys or server costs.

## Built-in AI APIs in Chrome

Chrome ships several on-device AI APIs. This project uses the Prompt API; the others are available for different tasks:

| API | Global | Best for |
| --- | --- | --- |
| Prompt API | `LanguageModel` | General chat, Q&A, classification, multimodal (text/image/audio) |
| Summarizer API | `Summarizer` | Summarizing long text |
| Writer API | `Writer` | Generating new content |
| Rewriter API | `Rewriter` | Rewriting existing text |
| Proofreader API | `Proofreader` | Grammar and spelling fixes |
| Translator API | `Translator` | Translation |
| Language Detector | `LanguageDetector` | Detecting language |

See the official docs: [The Prompt API](https://developer.chrome.com/docs/ai/prompt-api).

## Project structure

```
app/
  components/
    prompt-api-demo.tsx   # Client-side Prompt API demo
  page.tsx                # Home page
types/
  chrome-ai.d.ts          # TypeScript types for LanguageModel
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [AI on Chrome](https://developer.chrome.com/docs/ai)
- [Prompt API explainer](https://github.com/webmachinelearning/prompt-api)
