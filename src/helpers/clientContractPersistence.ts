import { createContractsForSignedLines, dispatchContractsApiRefresh } from '../api/contractService';
import { appendSignedCartMockRecord, type ServiceCartLine } from './clientServiceCart';
import type { ContractRecord } from '../types';

/**
 * Tries server-side contract creation (OpenAPI). On failure, keeps existing localStorage behaviour.
 */
export async function persistSignedClientContractsWithApiFallback(
  signedLines: ServiceCartLine[],
  payload: { dataUrl: string; applyToAll: boolean },
): Promise<ContractRecord[]> {
  if (signedLines.length === 0) return [];
  try {
    const contracts = await createContractsForSignedLines(
      signedLines,
      payload.dataUrl,
      true, // acceptedTerms
    );
    dispatchContractsApiRefresh();
    return contracts;
  } catch {
    appendSignedCartMockRecord({
      signedAt: new Date().toISOString(),
      signatureDataUrl: payload.dataUrl,
      applyToAll: payload.applyToAll,
      artistSignatureComplete: false,
      lines: signedLines,
    });
    return [];
  }
}
