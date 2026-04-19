'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { UserNotification } from '@/types';

interface UrgentAlertBannerProps {
  alerts: UserNotification[];
  onDismiss: (id: string) => void;
}

export function UrgentAlertBanner({ alerts, onDismiss }: UrgentAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">{alert.title}</p>
              <p className="text-xs text-red-700">{alert.message}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="ml-4 rounded p-1 text-red-600 transition-colors hover:bg-red-100"
            aria-label="Descartar alerta urgente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
