'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAllIncidences } from '@/features/dashboard/hooks/useAllIncidences';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useDismissNotification } from '@/features/notifications/hooks/useDismissNotification';
import { useFCM } from '@/features/notifications/hooks/useFCM';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { UrgentAlertBanner } from '@/features/notifications/components/UrgentAlertBanner';
import { ConfirmDismissModal } from '@/features/notifications/components/ConfirmDismissModal';
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar';
import type { UserNotification } from '@/types';

export function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const { incidences } = useAllIncidences();

  const userId = user?.uid;
  const isAdmin = user?.role === 'admin';

  const {
    notifications,
    urgentAlerts,
    unreadCount,
    markAsRead,
  } = useNotifications(isAdmin ? userId : undefined);

  const { dismiss, isLoading: dismissLoading } = useDismissNotification();
  useFCM();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    notification: UserNotification | null;
  }>({ open: false, notification: null });

  const handleDismissRequest = (id: string, urgency: 'normal' | 'urgent') => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    if (urgency === 'urgent') {
      setConfirmModal({ open: true, notification });
    } else {
      dismiss(id, userId);
    }
  };

  const handleConfirmDismiss = async () => {
    if (!confirmModal.notification || !userId) return;
    await dismiss(confirmModal.notification.id, userId);
    setConfirmModal({ open: false, notification: null });
  };

  const handleSearchSelect = (incidence: { id: string }) => {
    router.push(`/dashboard/incidences?id=${incidence.id}`);
  };

  if (!isAdmin) {
    // Para usuarios no-admin no mostramos notificaciones de admin ni buscador global
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <GlobalSearchBar
            incidences={incidences}
            onSelect={handleSearchSelect}
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onDismiss={handleDismissRequest}
          />

          <button
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Configuración"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">
            {user?.displayName
              ? user.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : <User className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Urgent Alerts */}
      <UrgentAlertBanner
        alerts={urgentAlerts}
        onDismiss={(id) => handleDismissRequest(id, 'urgent')}
      />

      {/* Confirm Dismiss Modal */}
      <ConfirmDismissModal
        open={confirmModal.open}
        notificationTitle={confirmModal.notification?.title ?? ''}
        onConfirm={handleConfirmDismiss}
        onCancel={() => setConfirmModal({ open: false, notification: null })}
        isLoading={dismissLoading}
      />
    </div>
  );
}
