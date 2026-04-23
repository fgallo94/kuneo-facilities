'use client';

import { useState, useMemo } from 'react';
import { Mail, Phone, Save, Check } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useUpdateUserProfile } from '../hooks/useUpdateUserProfile';
import type { NotificationPreferences } from '@/types';

const DEFAULT_PREFS: NotificationPreferences = {
  incidenceCreated: ['email'],
  commentAdded: ['email'],
  conformityResponse: ['email'],
};

const EVENT_LABELS: Record<keyof NotificationPreferences, string> = {
  incidenceCreated: 'Nueva incidencia creada',
  commentAdded: 'Nuevo comentario de usuario',
  conformityResponse: 'Conformidad aceptada o rechazada',
};

export function AdminNotificationsSettings() {
  const { user: authUser } = useAuth();
  const { users } = useUsers();
  const { updateProfile, isLoading } = useUpdateUserProfile();
  const [saved, setSaved] = useState(false);

  const currentUser = users.find((u) => u.uid === authUser?.uid);

  const basePhone = currentUser?.phone || '';
  const basePrefs = useMemo(
    () =>
      currentUser?.notificationPreferences
        ? {
            incidenceCreated: [...currentUser.notificationPreferences.incidenceCreated],
            commentAdded: [...currentUser.notificationPreferences.commentAdded],
            conformityResponse: [...currentUser.notificationPreferences.conformityResponse],
          }
        : DEFAULT_PREFS,
    [currentUser]
  );

  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftPrefs, setDraftPrefs] = useState<NotificationPreferences | null>(null);

  const localPhone = draftPhone ?? basePhone;
  const localPrefs = draftPrefs ?? basePrefs;

  const toggleChannel = (
    event: keyof NotificationPreferences,
    channel: 'email' | 'whatsapp'
  ) => {
    setDraftPrefs((prev) => {
      const current = prev ?? basePrefs;
      const has = current[event].includes(channel);
      const next = has ? current[event].filter((c) => c !== channel) : [...current[event], channel];
      return { ...current, [event]: next };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!authUser?.uid) return;
    await updateProfile(authUser.uid, {
      phone: localPhone || null,
      notificationPreferences: localPrefs,
    });
    setDraftPhone(null);
    setDraftPrefs(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges =
    draftPhone !== null ||
    draftPrefs !== null ||
    localPhone !== basePhone ||
    JSON.stringify(localPrefs) !== JSON.stringify(basePrefs);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charcoal">Notificaciones</h2>
        <p className="text-sm text-gray-500">
          Configura cómo quieres recibir alertas como administrador.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-semibold text-charcoal">
            Tu teléfono para WhatsApp
          </label>
          <input
            type="tel"
            value={localPhone}
            onChange={(e) => {
              setDraftPhone(e.target.value);
              setSaved(false);
            }}
            placeholder="+34 600 000 000"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <p className="mt-1 text-xs text-gray-500">
            Necesario para recibir notificaciones por WhatsApp. Debes enviar &quot;join teach-yet&quot; al +1 415 523 8886 primero.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-charcoal">Eventos</h3>
          <div className="space-y-3">
            {(Object.keys(EVENT_LABELS) as Array<keyof NotificationPreferences>).map((event) => (
              <div key={event} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                <span className="text-sm text-charcoal">{EVENT_LABELS[event]}</span>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={localPrefs[event].includes('email')}
                      onChange={() => toggleChannel(event, 'email')}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Email</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={localPrefs[event].includes('whatsapp')}
                      onChange={() => toggleChannel(event, 'whatsapp')}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">WhatsApp</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          {saved ? (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <Check className="h-4 w-4" />
              Guardado correctamente
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              {hasChanges ? 'Tienes cambios sin guardar' : 'Sin cambios'}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
