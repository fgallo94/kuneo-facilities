import type { IncidenceHistory, IncidenceStatus } from '@/types';

// Estados puramente administrativos que no aportan valor al usuario final
export const ADMIN_ONLY_STATUSES: IncidenceStatus[] = [
  'A falta de presupuesto',
  'Presupuestado',
  'Falta de material',
  'A facturar',
  'Facturada',
];

// Estados que el usuario sí debe ver porque le afectan directamente
export const USER_VISIBLE_STATUSES: IncidenceStatus[] = [
  'Reportada',
  'En reparación',
  'Reparado',
];

/**
 * Mapea un estado interno/administrativo a un estado público amigable
 * para usuarios no-administradores.
 */
export function getPublicStatus(status: IncidenceStatus): string {
  const map: Record<IncidenceStatus, string> = {
    'Reportada': 'Reportada',
    'En reparación': 'En reparación',
    'Reparado': 'Reparado',
    'A falta de presupuesto': 'En evaluación',
    'Presupuestado': 'En evaluación',
    'Falta de material': 'En espera',
    'A facturar': 'Resuelto',
    'Facturada': 'Cerrada',
  };
  return map[status] ?? status;
}

/**
 * Determina si una transición de estado es puramente administrativa
 * y no merece notificación ni visibilidad para el usuario final.
 */
export function isAdminOnlyTransition(
  fromStatus: IncidenceStatus,
  toStatus: IncidenceStatus
): boolean {
  // Si el destino es A facturar o Facturada, es 100% admin
  if (toStatus === 'A facturar' || toStatus === 'Facturada') return true;
  // Si ambos extremos son admin-only, la transición es puramente interna
  return (
    ADMIN_ONLY_STATUSES.includes(fromStatus) &&
    ADMIN_ONLY_STATUSES.includes(toStatus)
  );
}

/**
 * Determina si una entrada de historial debe mostrarse a un usuario no-admin.
 */
export function isHistoryVisibleToUser(entry: IncidenceHistory): boolean {
  switch (entry.changeType) {
    case 'creation':
      return true;

    case 'comment':
      return true;

    case 'conformity':
      return true;

    case 'status': {
      const oldStatus = (entry.oldStatus as IncidenceStatus) ?? 'Reportada';
      const newStatus = (entry.newStatus as IncidenceStatus) ?? 'Reportada';
      // Ocultar transiciones puramente administrativas
      return !isAdminOnlyTransition(oldStatus, newStatus);
    }

    case 'field': {
      // Ocultar comentarios técnicos del admin al cerrar reparación
      if (entry.field === 'repairEvidenceComment') return false;
      // Ocultar campos de facturación
      if (entry.field === 'invoiceData') return false;
      // El resto de campos (evidencia visual, disconformidad) sí se muestran
      return true;
    }

    default:
      return false;
  }
}

/**
 * Devuelve el texto público para una entrada de historial filtrada.
 * Reemplaza los nombres de estado internos por sus equivalentes públicos.
 */
export function formatPublicHistoryEntry(
  entry: IncidenceHistory
): { title: string; subtitle?: string } | null {
  const name = entry.changedByName || 'Usuario';

  if (entry.changeType === 'creation') {
    return { title: `${name} reportó la incidencia` };
  }

  if (entry.changeType === 'comment') {
    return { title: `${name} comentó`, subtitle: entry.comment };
  }

  if (entry.changeType === 'status') {
    const oldPublic = getPublicStatus((entry.oldStatus as IncidenceStatus) ?? 'Reportada');
    const newPublic = getPublicStatus((entry.newStatus as IncidenceStatus) ?? 'Reportada');
    return {
      title: `${name} actualizó el estado`,
      subtitle: `${oldPublic} → ${newPublic}`,
    };
  }

  if (entry.changeType === 'conformity') {
    const action =
      entry.newValue === 'accepted'
        ? 'aceptó'
        : entry.newValue === 'rejected'
          ? 'rechazó'
          : 'actualizó';
    return {
      title: `${name} ${action} la reparación`,
      subtitle: entry.oldValue ? `Anterior: ${entry.oldValue}` : undefined,
    };
  }

  if (entry.changeType === 'field') {
    if (entry.field === 'repairEvidenceImageUrls') {
      return { title: `${name} agregó evidencia de la reparación` };
    }
    if (entry.field === 'conformityImageUrls') {
      return { title: `${name} agregó evidencia de disconformidad` };
    }
    if (entry.field === 'conformityComment') {
      return {
        title: `${name} agregó comentario de disconformidad`,
        subtitle: entry.newValue ?? undefined,
      };
    }
    if (entry.field === 'conformityReason') {
      return {
        title: `${name} indicó motivo de disconformidad`,
        subtitle: entry.newValue ?? undefined,
      };
    }
    return { title: `${name} actualizó un campo` };
  }

  return null;
}

/**
 * Filtra y formatea el historial completo para mostrarlo a un usuario no-admin.
 */
export function getPublicHistory(history: IncidenceHistory[]): IncidenceHistory[] {
  return history.filter(isHistoryVisibleToUser);
}
