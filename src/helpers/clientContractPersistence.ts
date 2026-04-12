import { createContractsForSignedLines, dispatchContractsApiRefresh } from '../api/contractService';
import { appendSignedCartMockRecord, type ServiceCartLine } from './clientServiceCart';

/**
 * Tries server-side contract creation (OpenAPI). On failure, keeps existing localStorage behaviour.
 */
export async function persistSignedClientContractsWithApiFallback(
  signedLines: ServiceCartLine[],
  payload: { dataUrl: string; applyToAll: boolean },
): Promise<void> {
  if (signedLines.length === 0) return;
  try {
    await createContractsForSignedLines(signedLines);
    dispatchContractsApiRefresh();
  } catch {
    appendSignedCartMockRecord({
      signedAt: new Date().toISOString(),
      signatureDataUrl: payload.dataUrl,
      applyToAll: payload.applyToAll,
      artistSignatureComplete: false,
      lines: signedLines,
    });
  }
}
