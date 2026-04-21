'use client';

import React, { useState } from 'react';
import { useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';
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

function AdminSearchSection({ onSelect }: { onSelect: (incidence: { id: string }) => void }) {
  const { incidences } = useAllIncidences();
  return (
    <div className="flex-1">
      <GlobalSearchBar incidences={incidences} onSelect={onSelect} />
    </div>
  );
}

export function DashboardHeader() {
  const { user } = useAuth();
  const { openDetail } = useIncidenceDetailContext();

  const userId = user?.uid;
  const isAdmin = user?.role === 'admin';

  const {
    notifications,
    urgentAlerts,
    unreadCount,
    markAsRead,
  } = useNotifications(userId);

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
    openDetail(incidence.id);
  };

  const handleNotificationSelect = (incidenceId: string) => {
    openDetail(incidenceId);
  };

  return (
    <div className="space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        {isAdmin && <AdminSearchSection onSelect={handleSearchSelect} />}

        <div className="flex items-center gap-2 ml-auto">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onDismiss={handleDismissRequest}
            onSelect={handleNotificationSelect}
          />

          <button
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Configuración"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-charcoal">
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

      {/* Urgent Alerts — solo para admins */}
      {isAdmin && (
        <UrgentAlertBanner
          alerts={urgentAlerts}
          onDismiss={(id) => handleDismissRequest(id, 'urgent')}
        />
      )}

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
