import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ContractRecord } from '../types/contract';

export type DashboardStats = {
  totalEvents: number;
  eventsGrowthPercent: number;
  totalBalance: number;
  profileVisitsTotal: number;
  visitsChartData: { day: string; count: number }[];
};

export async function fetchArtistDashboardStats(artistId: string): Promise<DashboardStats> {
  const contractsRef = collection(db, 'contracts');
  const q = query(contractsRef, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  
  const contracts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContractRecord));
  
  // Calculate total events (Accepted or Completed)
  const activeEvents = contracts.filter(c => c.status === 'ACCEPTED' || c.status === 'COMPLETED');
  const totalEvents = activeEvents.length;

  // Calculate gross balance: Sum of totalAmount for PAID contracts
  const grossBalance = activeEvents.reduce((acc, c) => {
    if (c.financials?.paymentStatus === 'PAID') {
      return acc + (c.financials.totalAmount || 0);
    }
    return acc;
  }, 0);

  // Fetch withdrawals to calculate net balance
  const withdrawalsRef = collection(db, 'withdrawal_requests');
  const wq = query(withdrawalsRef, where('artistId', '==', artistId), where('status', '==', 'COMPLETED'));
  const wSnapshot = await getDocs(wq);
  const totalWithdrawn = wSnapshot.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);

  const totalBalance = Math.max(0, grossBalance - totalWithdrawn);

  // Profile visits (Real data from profile doc)
  let profileVisitsTotal = 0;
  try {
    const profileDoc = await getDoc(doc(db, 'artist_profiles', artistId));
    if (profileDoc.exists()) {
      profileVisitsTotal = profileDoc.data().stats?.visits || 0;
    }
  } catch {
    // ignore
  }

  // Growth calculation (Mocked for now as we don't have historical monthly stats yet)
  const eventsGrowthPercent = totalEvents > 0 ? 15 : 0; 

  // Visits chart (Mocked for now)
  const visitsChartData = generateMockVisitsData();

  return {
    totalEvents,
    eventsGrowthPercent,
    totalBalance,
    profileVisitsTotal,
    visitsChartData
  };
}

export async function fetchArtistCalendarEvents(artistId: string): Promise<ContractRecord[]> {
  const contractsRef = collection(db, 'contracts');
  const q = query(contractsRef, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContractRecord));
}

export async function fetchArtistWithdrawals(artistId: string): Promise<any[]> {
  const ref = collection(db, 'withdrawal_requests');
  const q = query(ref, where('artistId', '==', artistId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

function generateMockVisitsData() {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days.map(day => ({
    day,
    count: Math.floor(Math.random() * 50) + 10
  }));
}
