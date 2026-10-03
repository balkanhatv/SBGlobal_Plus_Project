import type { OperationContract } from "./operation-contract.js";

export class OperationRegistry {
  private readonly contracts = new Map<string, OperationContract>();

  register(contract: OperationContract): void {
    if (this.contracts.has(contract.operationId)) {
      throw new Error(`Duplicate OperationContract: ${contract.operationId}`);
    }
    this.contracts.set(contract.operationId, Object.freeze({
      ...contract,
      emittedEvents: Object.freeze([...contract.emittedEvents]),
      errorCodes: Object.freeze([...contract.errorCodes]),
    }));
  }

  get(operationId: string): OperationContract {
    const contract = this.contracts.get(operationId);
    if (!contract) {
      throw new Error(`Unknown OperationContract: ${operationId}`);
    }
    return contract;
  }

  list(): readonly OperationContract[] {
    return Object.freeze([...this.contracts.values()]);
  }
}
