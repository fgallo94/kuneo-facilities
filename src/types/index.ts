import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'apoderado' | 'operario' | 'user';
}

export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export const INCIDENCE_CATEGORIES = [
  'plumbing',
  'electrical',
  'carpentry',
  'hvac',
  'security',
  'cleaning',
  'other',
] as const;

export type IncidenceCategory = (typeof INCIDENCE_CATEGORIES)[number];

export const URGENCY_LEVELS = ['normal', 'high', 'urgent'] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export interface Installation {
  id: string;
  groupId: string;
  name: string;
  ownerDetails?: { name: string; nif?: string };
  exploiterDetails?: { name: string; nif?: string };
}

export interface Property {
  id: string;
  installationId: string;
  name: string;
  type?: string;
}

export interface Incidence {
  id: string;
  title: string;
  category: IncidenceCategory;
  propertyId: string;
  installationId: string;
  reportedBy: string;
  description: string;
  imageUrls: string[];
  status: 'Backlog' | 'Presupuestado' | 'En progreso' | 'Resuelto' | 'Cancelado';
  severity: number;
  billTo: 'Propietario' | 'Explotador';
  createdAt?: Timestamp;
}

export interface IncidenceHistory {
  id: string;
  changedBy: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Timestamp;
}
