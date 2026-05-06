import { useCallback, useEffect, useState } from 'react';
import type { ContractRecord } from '../types/contract';
import {
  fetchMyContractHistory,
  STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT,
} from '../api/contractService';

type UseClientMyContractsResult = {
  contracts: ContractRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useClientMyContracts(): UseClientMyContractsResult {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyContractHistory();
      setContracts(rows);
    } catch {
      setError('No se pudieron cargar los contratos. Intenta de nuevo más tarde.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onRefresh = () => void refetch();
    window.addEventListener(STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT, onRefresh);
  }, [refetch]);

  return { contracts, loading, error, refetch };
}
