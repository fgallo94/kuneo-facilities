import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'user';
  assignedEntities?: string[];
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

export const INCIDENCE_STATUSES = [
  'Reportada',
  'En reparación',
  'Reparado',
  'A falta de presupuesto',
  'Presupuestado',
  'Falta de material',
  'A facturar',
] as const;

export type IncidenceStatus = (typeof INCIDENCE_STATUSES)[number];

export type ConformityStatus = 'pending' | 'accepted' | 'rejected';

export interface Group {
  id: string;
  name: string;
  isActive: boolean;
  address?: string;
  description?: string;
  imageUrl?: string;
  assignedUserIds?: string[];
  createdAt?: Timestamp;
}

export interface Installation {
  id: string;
  groupId: string;
  name: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  ownerDetails?: { name: string; nif?: string };
  exploiterDetails?: { name: string; nif?: string };
  assignedUserIds?: string[];
  createdAt?: Timestamp;
}

export interface Property {
  id: string;
  installationId: string;
  name: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  assignedUserIds?: string[];
  createdAt?: Timestamp;
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
  status: IncidenceStatus;
  severity: number;
  urgency?: UrgencyLevel;
  billTo: 'Propietario' | 'Explotador';
  createdAt?: Timestamp;
  // Campos de conformidad
  conformityStatus?: ConformityStatus;
  conformityReason?: string;
  conformityComment?: string;
  conformityImageUrls?: string[];
  // Evidencia de reparación (adjuntada por admin al cerrar)
  repairEvidenceImageUrls?: string[];
  repairEvidenceComment?: string;
}

export interface IncidenceHistory {
  id: string;
  changedBy: string;
  changedByName?: string;
  changeType: 'status' | 'field' | 'comment' | 'creation' | 'conformity';
  oldStatus?: string;
  newStatus?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  timestamp: Timestamp;
}

export interface IncidenceComment {
  id: string;
  authorId: string;
  authorName?: string;
  text: string;
  createdAt: Timestamp;
}

export const NOTIFICATION_TYPES = [
  'new_incidence',
  'status_change',
  'comment',
  'conformity_request',
  'conformity_accepted',
  'conformity_rejected',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  incidenceId: string;
  urgency: Extract<UrgencyLevel, 'normal' | 'urgent'>;
  createdAt: Timestamp;
  createdBy: string;
}

export interface UserNotification {
  id: string;
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  incidenceId: string;
  urgency: Extract<UrgencyLevel, 'normal' | 'urgent'>;
  read: boolean;
  dismissed: boolean;
  dismissedAt?: Timestamp;
  dismissedBy?: string;
  createdAt: Timestamp;
}
