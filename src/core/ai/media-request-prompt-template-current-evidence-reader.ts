import type { RequestContext } from "../context/contracts.js";
import {
  matchesAIMediaRequestPromptTemplateBindingFloors,
} from "./media-request-prompt-template-binding-floors.js";
import type {
  AIMediaRequestReadPort,
  PersistedAIMediaRequest,
} from "./media-request.js";
import type {
  AIPromptTemplateReadPort,
  PersistedAIPromptTemplate,
} from "./prompt-template.js";

export interface AIMediaRequestPromptTemplateCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly mediaRequestId: string;
}

export interface AIMediaRequestPromptTemplateUnboundEvidence {
  readonly request: PersistedAIMediaRequest;
  readonly promptTemplate?: never;
}

export interface AIMediaRequestPromptTemplateBoundEvidence {
  readonly request: PersistedAIMediaRequest;
  readonly promptTemplate: PersistedAIPromptTemplate;
}

export type AIMediaRequestPromptTemplateCurrentEvidence =
  | AIMediaRequestPromptTemplateUnboundEvidence
  | AIMediaRequestPromptTemplateBoundEvidence;

/**
 * DD-593…DD-597: compose exact AIMediaRequest evidence with the existing
 * DD-188 optional PromptTemplate persisted-binding floor.
 *
 * An unbound request performs zero PromptTemplate reads. A bound request reads
 * exactly the persisted promptTemplateId under the same RequestContext and
 * applies DD-188. The result is relationship evidence only; it does not select,
 * render, approve or execute a prompt/media request.
 */
export async function loadAIMediaRequestPromptTemplateCurrentEvidence(
  input: AIMediaRequestPromptTemplateCurrentEvidenceReadInput,
  mediaRequestReader: AIMediaRequestReadPort,
  promptTemplateReader: AIPromptTemplateReadPort,
): Promise<AIMediaRequestPromptTemplateCurrentEvidence | null> {
  const request = await mediaRequestReader.loadForContext({
    requestContext: input.requestContext,
    mediaRequestId: input.mediaRequestId,
  });
  if (request === null) return null;

  if (request.promptTemplateId === undefined) {
    if (!matchesAIMediaRequestPromptTemplateBindingFloors(request, undefined)) {
      return null;
    }
    return Object.freeze({ request });
  }

  const promptTemplate = await promptTemplateReader.loadForContext({
    requestContext: input.requestContext,
    promptTemplateId: request.promptTemplateId,
  });
  if (promptTemplate === null) return null;

  if (!matchesAIMediaRequestPromptTemplateBindingFloors(
    request,
    promptTemplate,
  )) {
    return null;
  }

  return Object.freeze({
    request,
    promptTemplate,
  });
}
