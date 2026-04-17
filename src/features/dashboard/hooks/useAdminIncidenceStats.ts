'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Incidence } from '@/types';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface DailyTrend {
  label: string;
  high: number;
  medium: number;
}

export interface AdminStats {
  total: number;
  pendingReview: number;
  inProgress: number;
  resolved: number;
}

export interface AdminIncidenceStatsReturn {
  stats: AdminStats;
  chartData: DailyTrend[];
  loading: boolean;
  error: string | null;
}

interface UseAdminIncidenceStatsOptions {
  enabled?: boolean;
}

function getLast7Days(): DailyTrend[] {
  const result: DailyTrend[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    result.push({ label: DAYS[d.getDay()], high: 0, medium: 0 });
  }
  return result;
}

function normalizeDate(input: Date | Timestamp | { seconds: number; nanoseconds: number }): Date {
  if (input instanceof Date) return input;
  if ('toDate' in input && typeof input.toDate === 'function') {
    return input.toDate();
  }
  return new Date(input.seconds * 1000);
}

export function useAdminIncidenceStats(options?: UseAdminIncidenceStatsOptions): AdminIncidenceStatsReturn {
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [loading, setLoading] = useState(options?.enabled !== false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const db = getClientFirestore();
        const q = query(collection(db, 'incidences'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        if (cancelled) return;

        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          } as Incidence;
        });
        setIncidences(list);
        setLoading(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [options?.enabled]);

  const { stats, chartData } = useMemo(() => {
    const stats: AdminStats = {
      total: incidences.length,
      pendingReview: 0,
      inProgress: 0,
      resolved: 0,
    };

    const chartData = getLast7Days();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    incidences.forEach((inc) => {
      // Stats
      if (inc.status === 'Reportada') {
        stats.pendingReview += 1;
      } else if (inc.status === 'En reparación') {
        stats.inProgress += 1;
      } else if (inc.status === 'Reparado') {
        stats.resolved += 1;
      }

      // Chart data (last 7 days)
      if (inc.createdAt) {
        const incDate = normalizeDate(inc.createdAt);
        incDate.setHours(0, 0, 0, 0);
        const diffMs = now.getTime() - incDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const dayIndex = 6 - diffDays;
          if (inc.severity >= 3) {
            chartData[dayIndex].high += 1;
          } else {
            chartData[dayIndex].medium += 1;
          }
        }
      }
    });

    return { stats, chartData };
  }, [incidences]);

  return { stats, chartData, loading, error };
}
