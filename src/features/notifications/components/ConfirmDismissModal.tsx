'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDismissModalProps {
  open: boolean;
  notificationTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDismissModal({
  open,
  notificationTitle,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDismissModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirmar descarte
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Esta notificación es de <strong>alta urgencia</strong>.{' '}
              <span className="font-medium text-gray-800">{notificationTitle}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              ¿Está seguro de que desea descartarla? Se registrará que usted fue quien la descartó.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Descartando...' : 'Descartar alerta'}
          </Button>
        </div>

        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
