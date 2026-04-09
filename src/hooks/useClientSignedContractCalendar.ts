import { useEffect, useMemo, useState } from 'react';
import {
  buildCalendarGridEventsFromSignedRecords,
  buildUpcomingEventsFromGrid,
} from '../helpers/clientSignedCalendarEvents';
import {
  getSignedCartMockRecords,
  getSignedCartMockStorageKey,
  STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT,
} from '../helpers/clientServiceCart';

export function useClientSignedContractCalendar() {
  const [records, setRecords] = useState(getSignedCartMockRecords);

  useEffect(() => {
    const sync = () => setRecords(getSignedCartMockRecords());
    const key = getSignedCartMockStorageKey();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) sync();
    };
    window.addEventListener(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

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
