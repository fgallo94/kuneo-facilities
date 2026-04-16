'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

interface UserDirectoryProps {
  users: User[];
  onCreateUserClick: () => void;
}

export function UserDirectory({ users, onCreateUserClick }: UserDirectoryProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Directorio<br />de Usuarios
        </h3>
        <Button variant="primary" size="sm" onClick={onCreateUserClick}>
          + Crear Usuario
        </Button>
      </div>

      <div className="mb-2 flex border-b border-slate-100 pb-1 text-xs font-medium text-slate-400">
        <span className="flex-1">USUARIO</span>
        <span className="w-20 text-right">ROL</span>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.uid}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">
              {user.displayName?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase() ||
                '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.displayName || user.email}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
}
