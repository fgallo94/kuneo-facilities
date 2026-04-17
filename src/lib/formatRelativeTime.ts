import type { Timestamp } from 'firebase/firestore';

export function formatRelativeTime(
  date: Date | Timestamp | { seconds: number; nanoseconds: number } | undefined
): string {
  if (!date) return '';
  let target: Date;
  if (date instanceof Date) {
    target = date;
  } else if ('toDate' in date && typeof date.toDate === 'function') {
    target = date.toDate();
  } else {
    target = new Date(date.seconds * 1000);
  }

  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  if (diffHour > 0) return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffMin > 0) return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  return 'hace un momento';
}
