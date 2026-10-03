import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type FormFieldType =
  | "TEXT"
  | "NUMBER"
  | "DECIMAL"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "SELECT"
  | "MULTISELECT"
  | "REFERENCE"
  | "FILE"
  | "JSON_STRUCTURED";

export interface PersistedFormFieldDefinition {
  readonly id: string;
  readonly formDefinitionId: string;
  readonly fieldKey: string;
  readonly fieldType: FormFieldType;
  readonly labelKey: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly visibilityRuleRef?: string;
  readonly validationSchema: JsonValue;
  readonly referenceCatalogRef?: string;
  readonly sortOrder: number;
  readonly sensitivityClass: string;
  readonly createdAt: string;
}

export interface FormFieldDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly formFieldDefinitionId: string;
  }): Promise<PersistedFormFieldDefinition | null>;
}
