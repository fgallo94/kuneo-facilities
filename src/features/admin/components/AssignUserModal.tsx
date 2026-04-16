'use client';

import React, { useState } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/Button';

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUserIds: string[];
  onAssign: (userIds: string[]) => void;
  title?: string;
}

export function AssignUserModal({
  isOpen,
  onClose,
  users,
  selectedUserIds,
  onAssign,
  title = 'Asignar usuarios',
}: AssignUserModalProps) {
  const assignableUsers = users.filter((u) => u.role === 'user');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedUserIds);

  React.useEffect(() => {
    setLocalSelection(selectedUserIds);
  }, [selectedUserIds, isOpen]);

  const toggleUser = (uid: string) => {
    setLocalSelection((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = () => {
    onAssign(localSelection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {assignableUsers.map((user) => {
            const selected = localSelection.includes(user.uid);
            return (
              <label
                key={user.uid}
                className={[
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                  selected
                    ? 'border-blue-900 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-900"
                  checked={selected}
                  onChange={() => toggleUser(user.uid)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span
                  className={[
                    'rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {user.role}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
