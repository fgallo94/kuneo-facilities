export const ADMIN_ONLY_STATUSES = [
  'A falta de presupuesto',
  'Presupuestado',
  'Falta de material',
  'A facturar',
  'Facturada',
] as const;

export type AdminOnlyStatus = (typeof ADMIN_ONLY_STATUSES)[number];

export function getPublicStatus(status: string): string {
  const map: Record<string, string> = {
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
 * y no debe generar notificación al usuario final.
 */
export function isAdminOnlyTransition(fromStatus: string, toStatus: string): boolean {
  // Si el destino es A facturar o Facturada, es 100% admin
  if (toStatus === 'A facturar' || toStatus === 'Facturada') return true;
  // Si ambos extremos son admin-only, la transición es puramente interna
  return (
    ADMIN_ONLY_STATUSES.includes(fromStatus as AdminOnlyStatus) &&
    ADMIN_ONLY_STATUSES.includes(toStatus as AdminOnlyStatus)
  );
}
