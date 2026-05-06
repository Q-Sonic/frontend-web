import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildCalendarGridEventsFromSignedRecords,
  buildUpcomingEventsFromGrid,
} from '../helpers/clientSignedCalendarEvents';
import {
  getSignedCartMockRecords,
  getSignedCartMockStorageKey,
  STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT,
  type SignedCartMockRecord,
} from '../helpers/clientServiceCart';
import {
  fetchSignedCartMockRecordsFromApi,
  STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT,
} from '../api/contractService';

export function useClientSignedContractCalendar() {
  const [localRecords, setLocalRecords] = useState<SignedCartMockRecord[]>(() => getSignedCartMockRecords());
  const [apiRecords, setApiRecords] = useState<SignedCartMockRecord[]>([]);

  const refreshApi = useCallback(() => {
    void fetchSignedCartMockRecordsFromApi().then(setApiRecords);
  }, []);

  useEffect(() => {
    refreshApi();
  }, [refreshApi]);

  useEffect(() => {
    const onRefresh = () => refreshApi();
    window.addEventListener(STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT, onRefresh);
  }, [refreshApi]);

  useEffect(() => {
    const syncLocal = () => setLocalRecords(getSignedCartMockRecords());
    const key = getSignedCartMockStorageKey();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) syncLocal();
    };
    window.addEventListener(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT, syncLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT, syncLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const records = useMemo(
    () => [...apiRecords, ...localRecords],
    [apiRecords, localRecords],
  );

  return useMemo(() => {
    const gridEvents = buildCalendarGridEventsFromSignedRecords(records);
    const upcomingEvents = buildUpcomingEventsFromGrid(gridEvents);
    return {
      gridEvents,
      upcomingEvents,
      hasSignedContracts: records.length > 0,
    };
  }, [records]);
}
