'use client';

import React, { useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import type { UserNotification } from '@/types';

interface NotificationBellProps {
  notifications: UserNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string, urgency: 'normal' | 'urgent') => void;
  onSelect?: (incidenceId: string) => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDismiss,
  onSelect,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-charcoal"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-charcoal">Notificaciones</span>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-500">{notifications.length} pendientes</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No hay notificaciones pendientes
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={[
                    'group relative flex cursor-pointer flex-col gap-0.5 border-b border-gray-50 px-4 py-3 transition-colors',
                    n.read ? 'bg-white' : 'bg-brand/5',
                    'hover:bg-gray-50',
                  ].join(' ')}
                  onClick={() => {
                    if (!n.read) onMarkAsRead(n.id);
                    onSelect?.(n.incidenceId);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-charcoal">{n.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(n.id, n.urgency);
                      }}
                      className="rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                      aria-label="Descartar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="line-clamp-2 text-xs text-gray-600">{n.message}</p>
                  {n.urgency === 'urgent' && (
                    <span className="mt-1 w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700">
                      Urgente
                    </span>
                  )}
                  {!n.read && (
                    <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -trangray-y-1/2 rounded-full bg-brand-dark" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
