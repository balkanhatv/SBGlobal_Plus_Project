import type { RequestContext } from "../context/contracts.js";

export interface PersistedAIPromptSetMember {
  readonly id: string;
  readonly promptSetId: string;
  readonly promptTemplateId: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly createdAt: string;
}

export interface AIPromptSetMemberReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptSetMemberId: string;
  }): Promise<PersistedAIPromptSetMember | null>;
}
